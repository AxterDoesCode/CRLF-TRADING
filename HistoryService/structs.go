package main

type Battle struct {
	Type               string     `json:"type"`
	BattleTime         string     `json:"battleTime"`
	IsLadderTournament bool       `json:"isLadderTournament"`
	Arena              Arena      `json:"arena"`
	GameMode           Arena      `json:"gameMode"`
	DeckSelection      string     `json:"deckSelection"`
	Team               []Team     `json:"team"`
	Opponent           []Opponent `json:"opponent"`
	IsHostedMatch      bool       `json:"isHostedMatch"`
	LeagueNumber       int64      `json:"leagueNumber"`
}

type Arena struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
}

type Opponent struct {
	Tag                     string        `json:"tag"`
	Name                    string        `json:"name"`
	StartingTrophies        int64         `json:"startingTrophies"`
	TrophyChange            int64         `json:"trophyChange"`
	Crowns                  int64         `json:"crowns"`
	KingTowerHitPoints      int64         `json:"kingTowerHitPoints"`
	PrincessTowersHitPoints []int64       `json:"princessTowersHitPoints"`
	Cards                   []Card        `json:"cards"`
	SupportCards            []SupportCard `json:"supportCards"`
	GlobalRank              interface{}   `json:"globalRank"`
	ElixirLeaked            float64       `json:"elixirLeaked"`
}

type Card struct {
	Name              string       `json:"name"`
	ID                int64        `json:"id"`
	Level             int64        `json:"level"`
	EvolutionLevel    *int64       `json:"evolutionLevel,omitempty"`
	MaxLevel          int64        `json:"maxLevel"`
	MaxEvolutionLevel *int64       `json:"maxEvolutionLevel,omitempty"`
	Rarity            string       `json:"rarity"`
	ElixirCost        int64        `json:"elixirCost"`
	IconUrls          CardIconUrls `json:"iconUrls"`
	StarLevel         *int64       `json:"starLevel,omitempty"`
}

type CardIconUrls struct {
	Medium          string  `json:"medium"`
	EvolutionMedium *string `json:"evolutionMedium,omitempty"`
}

type SupportCard struct {
	Name     string              `json:"name"`
	ID       int64               `json:"id"`
	Level    int64               `json:"level"`
	MaxLevel int64               `json:"maxLevel"`
	Rarity   string              `json:"rarity"`
	IconUrls SupportCardIconUrls `json:"iconUrls"`
}

type SupportCardIconUrls struct {
	Medium string `json:"medium"`
}

type Team struct {
	Tag                     string        `json:"tag"`
	Name                    string        `json:"name"`
	StartingTrophies        int64         `json:"startingTrophies"`
	TrophyChange            int64         `json:"trophyChange"`
	Crowns                  int64         `json:"crowns"`
	KingTowerHitPoints      int64         `json:"kingTowerHitPoints"`
	PrincessTowersHitPoints interface{}   `json:"princessTowersHitPoints"`
	Clan                    Clan          `json:"clan"`
	Cards                   []Card        `json:"cards"`
	SupportCards            []SupportCard `json:"supportCards"`
	GlobalRank              interface{}   `json:"globalRank"`
	ElixirLeaked            float64       `json:"elixirLeaked"`
}

type Clan struct {
	Tag     string `json:"tag"`
	Name    string `json:"name"`
	BadgeID int64  `json:"badgeId"`
}

type TradeAction struct {
	Stock struct {
		Buy    bool   `json:"buy"`
		Ticker string `json:"ticker"`
		Shares int64  `json:"shares"`
	} `json:"stock"`
}

// Struct for sending deck data to encoding service
type DeckStruct struct {
	Deck []string `json:"deck"`
}

type PlayerStruct struct {
	PlayerID string `json:"playerId"`
}

type TradeStruct struct {
	PlayerID string `json:"playerid"`
	Symbol   string `json:"symbol"`
	Side     string `json:"side"`
	Quantity int    `json:"quantity"`
	T        int64  `json:"T"`
}
