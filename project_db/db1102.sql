-- ctrl + enter키 : 실행
-- 테이블 생성
create table member(
id varchar2(100) primary key,
pw varchar2(100) not null,
name varchar2(100),
phone varchar2(100),
gender varchar2(10) default '남자',
hobby varchar2(100) default '게임'
);

-- 테이블 삭제
drop table board;

-- 데이터입력
-- bbb 유관순, ccc 이순신, ddd 강감찬, eee 김구
insert into member(id,pw,name,phone,gender,hobby) values(
'aaa','1111','홍길동','010-1111-1111','남자','게임' );
insert into member(id,pw,name,phone,gender,hobby) values(
'bbb','1111','유관순','010-1111-1111','여자','게임' );
insert into member(id,pw,name,phone,gender,hobby) values(
'ccc','1111','이순신','010-1111-1111','남자','게임' );
insert into member(id,pw,name,phone,gender,hobby) values(
'ddd','1111','강감찬','010-1111-1111','남자','게임' );
insert into member(id,pw,name,phone,gender,hobby) values(
'eee','1111','김구','010-1111-1111','남자','게임' );
insert into member values (
'fff','1111','김유신','010-1111-1111','남자','게임');
insert into member (id,pw,phone) values(
'ggg','1111','010-1111-1111' );

-- 데이터 검색
select * from member;
select id,name from member;


-- 데이터 수정
update member set name= '홍길동'; --모든 컬럼 변경
update member set name= '홍길자' where id='ggg'; -- 특정컬럼 변경
update member set name='홍길순',phone='010-2222-2222',hobby='골프' where id='ggg';
-- 홍길순 성별-여자, 패스워드 2222
update member set gender='여자',pw='2222' where name='홍길순';

-- 데이터 삭제
delete from member where name='홍길동'; -- 부분삭제
delete from member;   -- 전체삭제
delete from member where gender='여자';
delete from member where gender='여자' and hobby='골프';


select * from member;

-- 데이터 최종저장 :commit해야 함.
commit;
rollback;

-- 타입설명
-- number : 숫자, varchar2 : 가변문자열, char:고정문자열, date:날짜, clob: 대용량문자열
create table board(
bno number(7) primary key, -- 1 ~ 9999999
btitle varchar2(1000),
bcontent clob,
bgroup number(7),
bstep number(4),
bindent number(4),
bdate date,
bfile varchar2(100)
);

