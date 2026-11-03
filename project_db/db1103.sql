-- 테이블 확인
select * from tab;

-- select:검색, insert:입력, update:수정, delete:삭제
-- commit:적용, rollback:되돌리기
-- row데이터 검색
-- table에 있는 컬럼 유형
desc member;

-- select : * 전체, 부분적컬럼을 가지고 검색
select * from employees;
select employee_id, emp_name, department_id from employees;
desc employees;

-- number,char,varchar2,date 타입
-- number : +,-,*,/ 가능
-- date : +,- 가능
-- varchar2 : 사칙연산 안됨.
select '가' || '나' from dual; -- 문자열타입 ||
select emp_name, email, emp_name||email from employees;
-- number타입
select emp_name,salary,salary*1342+(salary*1342*0.02) as k_salary from employees;
select sysdate-100,sysdate,sysdate+100 from member;
select salary*10 from employees;

desc employees;

-----------------------------------------------------------------
-- 연산자
-- salary, 원화로 월급, 원화로 년봉을 출력하시오.
select salary, salary*1342 as k_sal, salary*1342*12 k_a_sal from employees;

-- 
-- 판매부서만 commission : (salary+salary*commission_pct)
-- nvl(컬럼,0) : 없을때는 0으로 변경
select salary, commission_pct,salary+salary*nvl(commission_pct,0) real_salary from employees;
-- "  " 특수문자(&,$,%,@),한글 등을 사용할수 있음.
select salary, commission_pct,salary+salary*nvl(commission_pct,0) "실제월급" from employees;

-- 부서테이블을 모든 컬럼을 출력하시오.
select * from departments;
select department_id, department_name from departments;
select department_id || ' 부서는 '||department_name from departments;

-- distinct : 중복제거
select distinct(department_id) from employees;

-- job_id 중복제거후 출력하시오.
select distinct(job_id) from employees;
select * from jobs;

select department_id,department_name from employees;
select department_id,department_name from departments;

select employees.department_id,department_name from employees,departments
where employees.department_id = departments.department_id;

-- where조건절 : 비교 <,>,<=,>=,=
-- 2개 이상 and, or
select salary from employees;
select emp_name,salary from employees
where salary>5000;
select salary from employees
where salary = 6000;
select employee_id,salary from employees
where salary >= 6000 and department_id=50;

-- 급여가 4000 이하의 사원번호,사원이름, 급여를 출력하시오.
select employee_id,emp_name,salary from employees
where salary<=4000;

select hire_date from employees;
-- 날짜 비교
select hire_date from employees
where hire_date > '07/01/01';
select hire_date from employees
where hire_date > '2007/01/01';
select hire_date from employees
where hire_date >= '2007-01-01' and hire_date <= '07/12/31';
--select hire_date from employees
--where hire_date > '2007년01월01일';  불가


-- 부서번호가 50 이면서 월급 8000 이상인 사원을 출력하시오.
select * from employees
where department_id = 50 and salary >= 8000;
-- 부서번호가 10 이거나 30 이거나 100 인 사원을 출력하시오.
select * from employees
where department_id=10 or department_id = 30 or department_id = 100;

