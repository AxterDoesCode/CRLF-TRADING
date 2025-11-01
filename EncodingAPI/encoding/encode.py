#pass

# request = {
#     "buy": True,
#     "shares": 16,
#     "ticker": "MSFT",
# }

# relations = {
#     "buy": "26000010", #skeletons
#     "sell": "26000001", #archers
#     "tickers": {
#         "AAPL": "28000001", #arrows
#         "MSFT": "26000015", #baby dragon
#         "NVDA": "26000006", #balloon
#         "GOOGL": "26000046", #bandit
#     },
# }

# tickers_to_cards = {
#     "AAPL": "28000001", #arrows
#     "MSFT": "26000015", #baby dragon
#     "NVDA": "26000006", #balloon
#     "GOOGL": "26000046", #bandit
# }

tickers_to_bits = {
    "AAPL": "00",
    "MSFT": "01",
    "NVDA": "10",
    "GOOGL": "11",
}

bits_to_cards = [ #input card ids here
    ["28000001", "26000005"], #arrows, minions
    ["26000001", "26000000"], #archers, knight
    ["28000000", "26000018"], #Fireball, Mini Pekka
    ["26000014", "26000003"], #Musketeer, Giant
    ["26000019", "26000002"], #Spear Goblins, Goblins
    ["27000012", "27000001"], #Goblin Cage, Goblin Hut
    ["26000013", "26000010"], #Bomber, Skeletons
    ["27000009", "26000011"], #Tombstone, Valkyrie
]

class Encode(object):

    def __init__(self, request):
        # request = {
        #     "buy": True,
        #     "shares": 16,
        #     "ticker": "MSFT",
        # }
        self.request = request

    def encode_to_binary(self):
        encoded_binary_string = ""
        encoded_binary_string += self._generate_from_buy_sell()
        encoded_binary_string += self._generate_from_ticker()
        encoded_binary_string += self._generate_from_shares()
        return encoded_binary_string
    
    def encode_to_deck(self, binary_string):
        deck = []
        for i in range(len(binary_string)):
            card_set = bits_to_cards[i]
            card = card_set[int(binary_string[i])]
            deck.append(card)
        return deck

    def _generate_from_buy_sell(self):
        if self.request.get("buy"):
            return "1"
        else:
            return "0"
    
    def _generate_from_ticker(self):
        ticker = self.request.get("ticker")
        bits = tickers_to_bits.get(ticker)
        return bits

    def _generate_from_shares(self):
        shares = self.request.get("shares")
        shares = round(shares)
        if shares > 31:
            shares = 31
        if shares == 0:
            shares = 1
        binary_shares = "{0:05b}".format(shares)
        return binary_shares
    
# encode = Encode(request)
# binary_encoding = encode.encode_to_binary()
# print("binary encoding: ", binary_encoding)
# deck_encoding = encode.encode_to_deck(binary_encoding)
# print("deck encoding: ", deck_encoding)

class Decode(object):
    def __init__(self, request):
        self.request = request #expect JSON object with single entry called "deck": array of card IDs

    def decode_from_deck_to_binary(self):
        binary_string = ""
        for i in range(len(bits_to_cards)):
            for j in range(0,2):
                if bits_to_cards[i][j] == self.request.get("deck")[i]:
                    binary_string += str(j)

        return binary_string
    
    def decode_from_binary_to_stock(self, binary_string):
        data = {
            "buy": False
        }
        if binary_string[0] == "1":
            data["buy"] = True
        
        ticker_bits = binary_string[1:3]
        for ticker, bits in tickers_to_bits.items():
            if bits == ticker_bits:
                data["ticker"] = ticker
        
        share_bits = binary_string[3:]
        data["shares"] = int(share_bits, 2)
        return data
    

# decode = Decode({"deck": deck_encoding})
# binary_decoding = decode.decode_from_deck_to_binary()
# print(binary_decoding)
# stock = decode.decode_from_binary_to_stock(binary_decoding)
# print(stock)