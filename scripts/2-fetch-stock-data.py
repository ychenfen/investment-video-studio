#!/usr/bin/env python3.13
# 抓 NVDA(美股) + 寒武纪(A股) 真实 OHLCV, 存 remotion/src/stockData.json
# 用法(关键: 不走代理, 东财/新浪是国内接口):
#   env -u http_proxy -u https_proxy -u HTTP_PROXY -u HTTPS_PROXY \
#     /opt/homebrew/bin/python3.13 2-fetch-stock-data.py
# 依赖: akshare(python3.13). 坑: 接口会限流/不稳, 失败就重跑或换接口
import akshare as ak
import json
import os

def fetch_nvda():
    # 新浪美股接口(stock_us_daily); 不稳时多试几次
    df = ak.stock_us_daily(symbol='NVDA', adjust='').tail(24)
    return [{
        'date': str(r['date'])[5:10],
        'o': round(float(r['open']), 2), 'h': round(float(r['high']), 2),
        'l': round(float(r['low']), 2), 'c': round(float(r['close']), 2),
        'v': round(float(r['volume']) / 1e6, 1),  # 百万股
    } for _, r in df.iterrows()]

def fetch_cam():
    # 东财A股接口(stock_zh_a_hist); 前复权
    df = ak.stock_zh_a_hist(symbol='688256', period='daily',
                            start_date='20260420', end_date='20260603', adjust='qfq').tail(24)
    return [{
        'date': str(r['日期'])[5:],
        'o': round(float(r['开盘']), 1), 'h': round(float(r['最高']), 1),
        'l': round(float(r['最低']), 1), 'c': round(float(r['收盘']), 1),
        'v': int(r['成交量']), 'pct': round(float(r['涨跌幅']), 2),
    } for _, r in df.iterrows()]

if __name__ == '__main__':
    data = {}
    try:
        data['nvda'] = fetch_nvda()
        print(f"NVDA: {len(data['nvda'])} 根")
    except Exception as e:
        print(f"NVDA 抓取失败({e}), 保留旧数据")
    try:
        data['cam'] = fetch_cam()
        print(f"寒武纪: {len(data['cam'])} 根")
    except Exception as e:
        print(f"寒武纪抓取失败({e}), 保留旧数据")

    out = os.path.join(os.path.dirname(__file__), '../remotion/src/stockData.json')
    # 只更新成功抓到的, 失败的保留旧值
    if os.path.exists(out):
        old = json.load(open(out))
        old.update(data)
        data = old
    json.dump(data, open(out, 'w'), ensure_ascii=False)
    print('saved', out)
