package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
)

const DEBUG_LOAD_BATTLES_FROM_FILE = false
const DEBUG_LOSE_MODE = true
const DEBUG_STILL_INCLUDE_HISTORICAL_BATTLES = false

const ROYALE_API_URL = "https://proxy.royaleapi.dev/v1"
const ENCODE_API_URL = "http://localhost:8000/encoding/encode"
const DECODE_API_URL = "http://localhost:8000/encoding/decode"
const TRADING_API_URL = "http://localhost:3003"

const PLAYERTAGURI = "%232YLCP0R8"
const PLAYERTAG = "2YLCP0R8"

func main() {
	client := &http.Client{}
	r := mux.NewRouter()

	r.HandleFunc("/addPlayer", addPlayerHandler)

	err := godotenv.Load()
	if err != nil {
		log.Println(err)
		return
	}

	// Poll royale API in a different thread
	interval := 5 * time.Second
	ticker := time.NewTicker(interval)
	go pollRoyaleApi(client, ticker)

	// Start the Http server on the blocking thread
	http.ListenAndServe(":8010", r)
	defer fmt.Println("Main thread dead")
	// Block the main thread
	for {
	}
}

func addPlayerHandler(w http.ResponseWriter, r *http.Request) {

}

func pollRoyaleApi(client *http.Client, ticker *time.Ticker) {
	baseUrl := ROYALE_API_URL

	var alreadyProcessedBattleHashes map[string]struct{}

	log.Println("Service about to start")

	alreadyProcessedBattleHashes = getCurrentHistoryBattleHashes(client, baseUrl)

	log.Println("Service running so swag")

	for {
		select {
		case <-ticker.C:
			runIteration(alreadyProcessedBattleHashes, client, baseUrl)
		}
	}
}

func getCurrentHistoryBattleHashes(client *http.Client, baseUrl string) map[string]struct{} {
	if DEBUG_STILL_INCLUDE_HISTORICAL_BATTLES {
		return make(map[string]struct{})
	} else {
		battles := requestPlayerBattleHistory(client, baseUrl)

		currentBattleHashes := make(map[string]struct{})
		for _, battle := range battles {
			currentBattleHashes[getBattleHashId(battle)] = struct{}{}
		}

		log.Printf("Found %d pre-existing battles in history\n", len(currentBattleHashes))

		return currentBattleHashes
	}
}

func runIteration(alreadyProcessedBattleHashes map[string]struct{}, client *http.Client, baseUrl string) {
	battles := requestPlayerBattleHistory(client, baseUrl)

	processBattleHistory(client, alreadyProcessedBattleHashes, battles)
}

func requestPlayerBattleHistory(client *http.Client, baseUrl string) []Battle {
	var battles []Battle

	//%23 is a URL encoding for #
	// playerTag := "%232YLCP0R8"
	url := fmt.Sprintf("%s/players/%s/battlelog", baseUrl, PLAYERTAGURI)

	var err error
	var body []byte

	if DEBUG_LOAD_BATTLES_FROM_FILE {
		file, err := os.Open("test.json")
		if err != nil {
			log.Println(err)
		}
		defer file.Close()

		body, err = io.ReadAll(file)
		if err != nil {
			log.Println(err)
			return battles
		}
	} else {
		req, err := http.NewRequest("GET", url, nil)
		if err != nil {
			log.Println(err)
			return battles
		}

		token := os.Getenv("API_KEY")
		req.Header.Add("Authorization", "Bearer "+token)

		resp, err := client.Do(req)
		if err != nil {
			log.Println(err)
			return battles
		}
		defer resp.Body.Close()

		body, err = io.ReadAll(resp.Body)
		if err != nil {
			log.Println(err)
			return battles
		}
	}

	err = json.Unmarshal(body, &battles)
	if err != nil {
		fmt.Println("Error unmarshalling json resp")
		log.Println(err)
		return battles
	}

	// testJson, err := json.Marshal(battles)
	// if err != nil {
	//     log.Println(err)
	// }

	// os.WriteFile("Proxy.json", testJson, os.ModePerm)

	return battles
}

func processBattleHistory(client *http.Client, alreadyProcessedBattleHashes map[string]struct{}, battles []Battle) {
	for _, battle := range battles {
		if len(battle.Team) == 2 {
			// Ignore 2v2s
			continue
		} else if len(battle.Team) != 1 {
			log.Printf("Error: Unexpected team size: %d\n", len(battle.Team))
			continue
		}

		team := battle.Team[0]

		if !(trophyChangeIsRecordMe(team.TrophyChange)) {
			// Don't process losses
			continue
		}

		if _, exists := alreadyProcessedBattleHashes[getBattleHashId(battle)]; exists {
			// Already processed
			continue
		} else {
			alreadyProcessedBattleHashes[getBattleHashId(battle)] = struct{}{}
		}

		log.Printf("Processing deck: ")
		log.Printf("Battle time %s, Opponent: %s", battle.BattleTime, battle.Opponent[0].Name)
		for _, card := range team.Cards {
			log.Printf("%s ", card.Name)
		}
		log.Printf("\n")

		actionToPerform, err := decodeDeck(client, team.Cards)
		if err != nil {
			log.Printf("Error decoding deck: %v\n", err)
			continue
		}

		log.Printf("Decoded trade action: %+v\n", actionToPerform)

		// TODO - Hit the trading service with the order
		err = createPlayer(client)
		if err != nil {
			log.Printf("Error creating player", err)
		}
		err = makeTrade(client, actionToPerform)
		if err != nil {
			log.Printf("Error making trade: %v\n", err)
			continue
		}
	}
}

func createPlayer(c *http.Client) error {
	player := PlayerStruct{PlayerID: PLAYERTAG}

	payload, err := json.Marshal(player)
	if err != nil {
		log.Println(err)
		return err
	}

	// os.WriteFile("player.json", payload, os.ModePerm)

	req, err := http.NewRequest("POST", TRADING_API_URL+"/player", bytes.NewReader(payload))
	if err != nil {
		log.Println(err)
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	res, err := c.Do(req)
	if err != nil {
		log.Println(err)
		if res.StatusCode == http.StatusBadRequest {
			return nil
		}
		return err
	}
	return nil
}

func makeTrade(c *http.Client, trade TradeAction) error {
	side := ""
	if trade.Stock.Buy {
		side = "buy"
	} else {
		side = "sell"
	}
	fmt.Println("ticker", trade.Stock.Ticker)
	fmt.Println("Side", side)
	fmt.Println("Quantity", trade.Stock.Shares)

	now := time.Now()
	// Get start of the day (midnight)
	startOfDay := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	// Compute seconds since start of the day
	secondsSinceStart := int64(now.Sub(startOfDay).Seconds())

	tradeStruct := TradeStruct{
		PlayerID: PLAYERTAG,
		Symbol:   trade.Stock.Ticker,
		Side:     side,
		Quantity: int(trade.Stock.Shares),
		T:        secondsSinceStart,
	}

	payload, err := json.Marshal(tradeStruct)
	if err != nil {
		log.Println(err)
		return err
	}

	// os.WriteFile("trade.json", payload, os.ModePerm)

	req, err := http.NewRequest("POST", TRADING_API_URL+"/trade", bytes.NewReader(payload))
	if err != nil {
		log.Println(err)
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	_, err = c.Do(req)
	if err != nil {
		log.Println(err)
		return err
	}
	return nil
}

func getBattleHashId(battle Battle) string {
	// Use just the battle time and opponent tag
	return fmt.Sprintf("%s-%s-%s", battle.Team[0].Tag, battle.BattleTime, battle.Opponent[0].Tag)
}

func trophyChangeIsRecordMe(trophyChange int64) bool {
	if DEBUG_LOSE_MODE {
		return trophyChange <= 0
	} else {
		return trophyChange > 0
	}
}

func decodeDeck(c *http.Client, cards []Card) (TradeAction, error) {
	cardIds := getTeamDeckCardIds(cards)

	payload, err := json.Marshal(cardIds) // encode []int64 as JSON
	if err != nil {
		log.Println(err)
		return TradeAction{}, err
	}

	// os.WriteFile("temp.json", payload, os.ModePerm)

	req, err := http.NewRequest("POST", DECODE_API_URL, bytes.NewReader(payload))
	if err != nil {
		log.Println(err)
		return TradeAction{}, err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.Do(req)
	if err != nil {
		log.Println(err)
		return TradeAction{}, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Println(err)
		return TradeAction{}, err
	}

	var action TradeAction
	if err := json.Unmarshal(body, &action); err != nil {
		log.Println(err)
		return TradeAction{}, err
	}

	return action, nil
}

func getTeamDeckCardIds(cards []Card) DeckStruct {
	var cardIds []string
	for _, card := range cards {
		cardIds = append(cardIds, fmt.Sprintf("%d", card.ID))
	}

	deckStruct := DeckStruct{Deck: cardIds}
	return deckStruct
}
