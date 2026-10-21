from django.shortcuts import render
import os
from pathlib import Path
from dotenv import load_dotenv

def index(request):
    env_path = Path(__file__).resolve().parent.parent
    env_file = env_path / '.env'
    load_dotenv(dotenv_path=env_file)
    api_key = os.getenv("PUBLIC_KEY")

    print("API 키 로드 여부:", api_key)
    return render(request,'index.html')

