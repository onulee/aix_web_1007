from django.shortcuts import render, redirect
import os
from pathlib import Path
from dotenv import load_dotenv
from django.db.models import F,Q
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET
from django.contrib.auth.hashers import make_password, check_password
from member.models import Member
import smtplib
from email.mime.text import MIMEText
import random
import string


# 로그인 : GET → 화면, POST → 아이디/비밀번호 확인
def login(request):
    if request.method == 'GET':
        return render(request, 'login.html')

    id = request.POST.get('id', '')
    pw = request.POST.get('pw', '')

    qs = Member.objects.filter(id=id)
    if qs.exists() and check_password(pw, qs[0].pw):
        # 로그인 성공 → 세션에 저장
        request.session['session_id'] = id
        request.session['session_nickname'] = qs[0].nickname
        return redirect('index')

    # 로그인 실패 → 다시 로그인 화면 + 메시지
    context = {'msg': '아이디 또는 비밀번호가 맞지 않습니다.', 'id': id}
    return render(request, 'login.html', context)


# 이메일전송후 인증키확인
def ekey(request):
    # 인증키가져오기
    email_key = request.POST.get('email_key','')
    session_e_key = request.session['session_e_key']
    print(f"데이터 확인 : {email_key},{session_e_key}")
    if email_key == session_e_key:
        context = {'temp':1}
    else:
        context = {'temp':0}

    return JsonResponse(context)


# 이메일전송
def emailsend(request):
    # 1.email주소
    email = request.POST.get('email','')
    print('이메일주소확인 : ',email)

    # 2. 네이버 비밀번호 가져오기 (.env)
    BASE_DIR = Path(__file__).resolve().parent.parent
    ENV_FILE = BASE_DIR / ".env"
    load_dotenv(ENV_FILE)
    naver_key = os.getenv('naver_key')
    print('네이버인증키 : ',naver_key)

    # 3. 인증키난수생성
    # chars = ['0','1','2','3','4','5','6','7','8','9','a','z']
    #       0-9문자열 + a-z까지 문자열
    chars = string.digits + string.ascii_lowercase
    # 중복가능:choices, 중복불가:sample / 리스트 -> 문자열
    e_key = ''.join(random.choices(chars,k=10))
    print(e_key)

    # 4. 이메일내용 - 글자로 이메일발송
    sendEmail = 'onulee@naver.com'
    content = f'이메일확인 인증키 : {e_key}'
    text = f'''
        <html>
            <body>
                <h2>[ 이메일확인 인증키 ]</h2>
                <p>{e_key}</p>
            </body>
        </html>
    '''

    # 5. 정보그룹핑
    # msg = MIMEText(content)
    msg = MIMEText(text,'html')
    msg['From'] = sendEmail # 보내는사람
    msg['To'] = email                # 받는사람
    msg['Subject'] = '이메일 TEST2'    # 제목

    # 6. 그룹핑 정보전송
    s = smtplib.SMTP("smtp.naver.com",587) #SMTP 서버
    s.starttls() # 메일서버접근
    s.login(sendEmail,naver_key) # 메일서버로그인
    s.sendmail(sendEmail,email,msg.as_string()) # 메일발송
    s.close() # 메일닫기

    request.session['session_e_key'] = e_key
    context = {'e_key':e_key}
    return JsonResponse(context)

# 회원가입1
def step01(request):
    # 디렉토리 위치
    BASE_DIR = Path(__file__).resolve().parent.parent
    ENV_FILE = BASE_DIR / ".env"
    load_dotenv(ENV_FILE)
    naver_key = os.getenv('naver_key')
    print('네이버인증키 : ',naver_key)
    return render(request, 'step01.html')


# 로그아웃 : 세션 비우기
def logout(request):
    request.session.flush()
    return redirect('index')


# 회원가입 : GET → 화면, POST → 저장
@require_GET
def check_id(request):
    member_id = request.GET.get('id', '').strip()
    if not member_id or len(member_id) > 30:
        return JsonResponse({'available': False, 'message': '아이디를 1~30자로 입력해 주세요.'})
    available = not Member.objects.filter(id=member_id).exists()
    return JsonResponse({
        'available': available,
        'message': '이용가능한 아이디입니다.' if available else '중복이 되어 사용할 수 없습니다. 다시 입력해주세요.',
    })


def join(request):
    regions = [
    '서울', '부산', '대구', '인천', '광주', '대전', '울산',
    '세종', '경기', '강원', '충북', '충남', '전북', '전남',
    '경북', '경남', '제주',]
    if request.method == 'GET':
        return render(request, 'join.html', {'regions': regions})

    # 아이디 중복 확인
    id = request.POST.get('id', '').strip()

    if not id or len(id) > 30:
        return render(request, 'join.html', {
            'msg': '아이디를 1~30자로 입력해 주세요.', 'regions': regions,
        })

    if Member.objects.filter(id=id).exists():
        context = {
        'msg': '이미 사용 중인 아이디입니다.',
        'regions': regions,
        }
        return render(request, 'join.html', context)

    Member.objects.create(
        id       = id,
        pw       = make_password(request.POST.get('pw', '')),   # 암호화 저장
        name     = request.POST.get('name', ''),
        nickname = request.POST.get('nickname', ''),
        tel      = request.POST.get('tel', ''),
        gender   = request.POST.get('gender', ''),
        age_group = request.POST.get('age_group', ''),
        living_region = request.POST.get('living_region', ''),
        interest_region = request.POST.get('interest_region', ''),
    )
    return redirect('/member/login/?joined=1')