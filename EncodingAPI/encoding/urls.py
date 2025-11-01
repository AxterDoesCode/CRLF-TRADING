from django.urls import path

from .views import EncodeView, DecodeView

urlpatterns = [
    path("encode", EncodeView.as_view()),
    path("decode", DecodeView.as_view())
]