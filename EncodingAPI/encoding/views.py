from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from .encode import Encode

class EncodeView(APIView):

    def post(self, request):
        data = request.data
        encode = Encode()
        binary_encoding = encode.encode_to_binary()
        # print("binary encoding: ", binary_encoding)
        deck_encoding = encode.encode_to_deck(binary_encoding)
        # print("deck encoding: ", deck_encoding)
        return Response({"deck_encoding": deck_encoding})