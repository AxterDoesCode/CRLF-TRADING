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

func main() {
	c := &http.Client{}
	baseUrl := "https://proxy.royaleapi.dev/v1"

	err := godotenv.Load()
	if err != nil {
		log.Println(err)
		return
	}

	interval := 5 * time.Second
	ticker := time.NewTicker(interval)
	fmt.Println("Service running so swag")
	for {
		select {
		case <-ticker.C:
			pollPlayer(c, baseUrl)
		}
	}
}

func pollPlayer(c *http.Client, baseUrl string) {
	playerTag := "%232YLCP0R8"
	url := fmt.Sprintf("%s/players/%s/battlelog", baseUrl, playerTag)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		log.Println(err)
		return
	}

	token := os.Getenv("API_KEY")

	req.Header.Add("Authorization", "Bearer "+token)

	// HTTP Request
	resp, err := c.Do(req)
	if err != nil {
		log.Println(err)
		return
	}
	defer resp.Body.Close()

	// file, err := os.Open("test.json")
	// if err != nil {
	// 	log.Println(err)
	// }
	//
	// defer file.Close()

	var battles []Battle
	body, err := io.ReadAll(resp.Body)
	// body, err := io.ReadAll(file)
	if err != nil {
		log.Println(err)
		return
	}

	err = json.Unmarshal(body, &battles)
	if err != nil {
		fmt.Println("Error unmarshalling json resp")
		log.Println(err)
		return
	}

	// Some test shit
	for i := 0; i < 8; i++ {
		fmt.Println(battles[0].Team[0].Cards[i].Name)
	}

}
