from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from .encode import Encode, Decode

class EncodeView(APIView):

    def post(self, request):
        data = request.data
        encode = Encode(data)
        binary_encoding = encode.encode_to_binary()
        # print("binary encoding: ", binary_encoding)
        deck_encoding = encode.encode_to_deck(binary_encoding)
        print(deck_encoding)
        # print("deck encoding: ", deck_encoding)
        return Response({"deck_encoding": deck_encoding})
    
class DecodeView(APIView):
    def post(self, request):
        data = request.data
        decode = Decode(data)
        binary_decoding = decode.decode_from_deck_to_binary()
        stock = decode.decode_from_binary_to_stock(binary_decoding)
        return Response({"stock": stock})