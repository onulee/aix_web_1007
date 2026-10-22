from django.shortcuts import render
import os
from pathlib import Path
from dotenv import load_dotenv
from django.db.models import F,Q
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import smtplib                             
from email.mime.text import MIMEText
import random
import string
import json

# 인증키 확인 - 서버에서 확인할것
def ekey(request):
    ekey = request.POST.get('ekey','')
    s_key = request.session['session_e_key']
    if ekey == s_key:
        context = {'temp':1} # 인증성공
    else:
        context = {'temp':0} # 인증실패   
    return JsonResponse(context)

def email(request):
    # 1. 이메일 주소 가져오기
    email = request.POST.get('email','')
    print('데이터 확인 : ',email)

    # 네이버 이메일 발송하기 -----------------------------
    # 2. 네이버 비밀번호 가져오기 (.env)
    BASE_DIR = Path(__file__).resolve().parent.parent
    ENV_FILE = BASE_DIR / ".env"
    load_dotenv(ENV_FILE)
    naver_key = os.getenv('naver_key')
    print('네이버인증키 : ',naver_key)

    # 3. 인증키난수생성
    chars = string.digits + string.ascii_lowercase #0-9a-z
    e_key = ''.join(random.choices(chars,k=10))    #10개가져오기
    print(e_key)

    # 4. 이메일내용 - 글자로 이메일발송
    sendEmail = 'onulee@naver.com'
    content = f'이메일확인 인증키 : {e_key}'
    
    # 5. 정보그룹핑
    msg = MIMEText(content)
    msg['From'] = sendEmail # 보내는사람
    msg['To'] = email                # 받는사람
    msg['Subject'] = '이메일 TEST2'    # 제목

    # 6. 그룹핑 정보전송
    s = smtplib.SMTP("smtp.naver.com",587) #SMTP 서버
    s.starttls() # 메일서버접근
    s.login(sendEmail,naver_key) # 메일서버로그인
    s.sendmail(sendEmail,email,msg.as_string()) # 메일발송
    s.close() # 메일닫기

    request.session['session_e_key'] = e_key # migrate를 안해서 session테이블

    context = {'e_key':e_key}
    # ---------------------------------------------------
    return JsonResponse(context)

def step01(request):
    # 디렉토리 위치
    BASE_DIR = Path(__file__).resolve().parent.parent
    ENV_FILE = BASE_DIR / ".env"
    load_dotenv(ENV_FILE)
    naver_key = os.getenv('naver_key')
    print('네이버인증키 : ',naver_key)
    return render(request, 'step01.html')

def step02(request):
    return render(request, 'step02.html')
