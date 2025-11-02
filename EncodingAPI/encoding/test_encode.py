from typing import List
import itertools
import pytest
from . import encode

CARDS = {
    "arrows": "28000001",
    "minions": "26000005",
    "archers": "26000001",
    "knight": "26000000",
    "fireball": "28000000",
    "mini-pekka": "26000018",
    "musketeer": "26000014",
    "giant": "26000003",
    "spear-goblins": "26000019",
    "goblins": "26000002",
    "goblin-cage": "27000012",
    "goblin-hut": "27000001",
    "bomber": "26000013",
    "skeletons": "26000010",
    "tombstone": "27000009",
    "valkyrie": "26000011",
}

BUY_VALUES = [True, False]
SHARES_VALUES = [1, 5, 10, 15, 20, 25, 30, 32]
TICKER_VALUES = ["AAPL", "MSFT", "GOOGL", "NVDA"]


def encode_trade(buy: bool, shares: int, ticker: str) -> List[str]:
    encoder = encode.Encode(
        {
            "buy": buy,
            "shares": shares,
            "ticker": ticker,
        }
    )

    binary = encoder.encode_to_binary()
    deck = encoder.encode_to_deck(binary)

    return deck


def decode_cards(card_ids: List[str]):
    decoder = encode.Decode({"deck": card_ids})

    binary = decoder.decode_from_deck_to_binary()
    obj = decoder.decode_from_binary_to_stock(binary)

    return {
        "buy": obj.get("buy"),
        "shares": obj.get("shares"),
        "ticker": obj.get("ticker"),
    }


@pytest.mark.parametrize(
    "buy, shares, ticker",
    list(itertools.product(BUY_VALUES, SHARES_VALUES, TICKER_VALUES)),
)
def test_encode_then_decode_inverse(buy, shares, ticker):
    deck = encode_trade(buy, shares, ticker)
    result = decode_cards(deck)

    assert result["buy"] == buy, f"Expected buy={buy}, got {result['buy']}"
    assert result["shares"] == round(
        shares
    ), f"Expected shares={round(shares)}, got {result['shares']}"
    assert (
        result["ticker"] == ticker
    ), f"Expected ticker={ticker}, got {result['ticker']}"
