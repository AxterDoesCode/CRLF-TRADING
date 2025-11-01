package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/joho/godotenv"
)

const DEBUG_MODE = true

func main() {
	c := &http.Client{}
	baseUrl := "https://proxy.royaleapi.dev/v1"

	err := godotenv.Load()
	if err != nil {
		log.Println(err)
		return
	}

	alreadyProcessedBattleHashes := make(map[string]struct{})

	interval := 5 * time.Second
	ticker := time.NewTicker(interval)

	fmt.Println("Service running so swag")

	for {
		select {
		case <-ticker.C:
			runIteration(alreadyProcessedBattleHashes, c, baseUrl)
		}
	}
}

func runIteration(alreadyProcessedBattleHashes map[string]struct{}, c *http.Client, baseUrl string) {
	battles := requestPlayerBattleHistory(c, baseUrl)

	processBattleHistory(alreadyProcessedBattleHashes, battles)
}

func requestPlayerBattleHistory(c *http.Client, baseUrl string) []Battle {
	var battles []Battle

	//%23 is a URL encoding for #
	playerTag := "%232YLCP0R8"
	url := fmt.Sprintf("%s/players/%s/battlelog", baseUrl, playerTag)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		log.Println(err)
		return battles
	}

	token := os.Getenv("API_KEY")
	req.Header.Add("Authorization", "Bearer "+token)

	var body []byte

	if DEBUG_MODE {
		// Just read from file
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
		// HTTP Request
		resp, err := c.Do(req)
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

	return battles
}

func processBattleHistory(alreadyProcessedBattleHashes map[string]struct{}, battles []Battle) {
	for _, battle := range battles {
		if len(battle.Team) == 2 {
			// Ignore 2v2s
			continue
		} else if len(battle.Team) != 1 {
			log.Printf("Error: Unexpected team size: %d\n", len(battle.Team))
			continue
		}

		team := battle.Team[0]

		if team.TrophyChange <= 0 {
			// Don't process losses
			continue
		}

		if _, exists := alreadyProcessedBattleHashes[getBattleHashId(battle)]; exists {
			// Already processed
			continue
		}

		// TODO - Send off the deck to the encoder

		// TODO - Hit the trading service with the order

		// Just temporary
		fmt.Printf("Processing: ")
		for _, card := range team.Cards {
			fmt.Printf("%s ", card.Name)
		}
		fmt.Printf("\n")
	}
}

func getBattleHashId(battle Battle) string {
	// Use just the battle time and opponent tag
	return fmt.Sprintf("%s-%s", battle.BattleTime, battle.Opponent[0].Tag)
}
