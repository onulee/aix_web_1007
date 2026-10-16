import pandas as pd

df = pd.read_csv('test/board.csv')
print(df)

df.to_csv('test/board2.csv', encoding='utf-8-sig' )