#!/usr/bin/env python
# coding: utf-8

# In[1]:


import tweepy
import requests
import datetime
import random


# In[2]:


url = "https://api.darksky.net/forecast/7cefa5e6ef956bf1d81c5c2f827b7021/35.708162, 139.736018?units=si&lang=ja"
data = requests.get(url).json()


# In[3]:


date = data['daily']['data'][0]['time']
high_temp_celsius = data['daily']['data'][0]['temperatureMax']
low_temp_celsius = data['daily']['data'][0]['temperatureMin']
weather = data['daily']['data'][0]['icon']
summary = data['daily']['data'][0]['summary']


# In[4]:


date = str(datetime.datetime.fromtimestamp(date))
print(date)


# In[5]:


tstr = date
tdatetime = datetime.datetime.strptime(tstr, '%Y-%m-%d %H:%M:%S')
tdate = datetime.date(tdatetime.year, tdatetime.month, tdatetime.day)
tyear = str(tdate.year)
tmonth = str(tdate.month)
tday = str(tdate.day)
print(tyear)
print(tmonth)
print(tday)


# In[6]:


print(high_temp_celsius)
print(low_temp_celsius)


# In[7]:


high_temp_celsius_round = round(high_temp_celsius, 1)
low_temp_celsius_round = round(low_temp_celsius, 1)


# In[8]:


high_temp_celsius_round = str(high_temp_celsius_round)
low_temp_celsius_round = str(low_temp_celsius_round)
print(high_temp_celsius_round)
print(low_temp_celsius_round)


# In[9]:


a = weather
if "rain" in a:
    a = "雨"
else:
    print(a)


# In[10]:


if "partly-cloudy" in a:
    a = "くもり時々晴れ"
else:
    print(a)


# In[11]:


if "clear-day" in a:
    a = "晴れ"
else:
    print(a)


# In[12]:


if "cloudy" in a:
    a = "くもり"
else:
    print(a)


# In[13]:


if "snow" in a:
    a = "雪"
else:
    print(a)


# In[14]:


if "wind" in a:
    a = "強風"
else:
    print(a)


# In[15]:


summary = str(summary)


# In[53]:


l = ["pta","ptb","ptc","ptd","pte"]
pattern=random.choice(l)
print(pattern)


# In[51]:

if pattern == "pta":
    if a == "雨":
        message = "あっ、おはようございます。佐々木千枝です。今日の天気をお伝えします。\n"+tyear+"年"+tmonth+"月"+tday+"日の東京の天気は"+a+"です。最高気温は"+high_temp_celsius_round+"度、最低気温は"+low_temp_celsius_round+"度です…\n…プロデューサーさん、傘を忘れずにもっていきましょう！#ブルナポ朝の天気予報 #ブルナポ応援企画"
        print(message)
        pic = '/Users/iwanaga/Documents/weatherforecast/写真/佐々木千枝/sc3.jpg'
    elif a == "晴れ":
        message = "おはようございます。佐々木千枝です。今日の天気をお伝えします。\n"+tyear+"年"+tmonth+"月"+tday+"日の東京の天気は"+a+"です。最高気温は"+high_temp_celsius_round+"度、最低気温は"+low_temp_celsius_round+"度です…\nプロデューサーさん、今日もいい一日になりそうですっ！ #ブルナポ朝の天気予報 #ブルナポ応援企画"
        print(message)
        pic = '/Users/iwanaga/Documents/weatherforecast/写真/佐々木千枝/sc4.jpg'
    elif a == "雪":
        message = "おはようございます。佐々木千枝です。今日の天気をお伝えします。\n"+tyear+"年"+tmonth+"月"+tday+"日の東京の天気は"+a+"です。最高気温は"+high_temp_celsius_round+"度、最低気温は"+low_temp_celsius_round+"度です…\nプロデューサーさん！雪ですよ！ #ブルナポ朝の天気予報 #ブルナポ応援企画"
        print(message)
        pic = '/Users/iwanaga/Documents/weatherforecast/写真/佐々木千枝/sc11.jpg'
    elif a == "くもり時々晴れ":
        message = "おはようございます。佐々木千枝です。今日の天気をお伝えします。\n"+tyear+"年"+tmonth+"月"+tday+"日の東京の天気は"+a+"です。最高気温は"+high_temp_celsius_round+"度、最低気温は"+low_temp_celsius_round+"度です。\n今日ははっきりしない天気になりそうです。#ブルナポ朝の天気予報 #ブルナポ応援企画"
        print(message)
        pic = '/Users/iwanaga/Documents/weatherforecast/写真/佐々木千枝/sc11.jpg'
    else:
        message = "おはようございます。佐々木千枝です。今日の天気をお伝えします。\n"+tyear+"年"+tmonth+"月"+tday+"日の東京の天気は"+a+"です。最高気温は"+high_temp_celsius_round+"度、最低気温は"+low_temp_celsius_round+"度です…\n千枝、寒いけど、頑張れますっ #ブルナポ朝の天気予報 #ブルナポ応援企画"
        print(message)
        pic = '/Users/iwanaga/Documents/weatherforecast/写真/佐々木千枝/sc10.jpg'
else:
    print(pattern)


# In[29]:


if pattern == "ptb":
    if a == "雨":
        message = "おはようございますっス！荒木比奈がお伝えする今日の天気予報っス\n"+tyear+"年"+tmonth+"月"+tday+"日の東京の天気は"+a+"っス！最高気温は"+high_temp_celsius_round+"度、最低気温は"+low_temp_celsius_round+"度っスよー。\n傘を忘れずに持っていくっスよ〜 #ブルナポ朝の天気予報 #ブルナポ応援企画"
        print(message)
        pic = '/Users/iwanaga/Documents/weatherforecast/写真/荒木比奈/ah4.jpg'
    elif a == "晴れ":
        message = "おはようございますっス！荒木比奈がお伝えする今日の天気予報っス\n"+tyear+"年"+tmonth+"月"+tday+"日の東京の天気は"+a+"っス！最高気温は"+high_temp_celsius_round+"度、最低気温は"+low_temp_celsius_round+"度っスよー。\nプロデューサー、いい天気っスね♪#ブルナポ朝の天気予報 #ブルナポ応援企画"
        print(message)
        pic = '/Users/iwanaga/Documents/weatherforecast/写真/荒木比奈/ah5.jpg'
    elif a == "雪":
        message = "おはようございますっス！荒木比奈がお伝えする今日の天気予報っス\n"+tyear+"年"+tmonth+"月"+tday+"日の東京の天気は"+a+"っス！最高気温は"+high_temp_celsius_round+"度、最低気温は"+low_temp_celsius_round+"度っスよー。\n寒い日は自宅で創作活動に勤しむっス。#ブルナポ朝の天気予報 #ブルナポ応援企画"
        print(message)
        pic = '/Users/iwanaga/Documents/weatherforecast/写真/荒木比奈/ah8.jpg'
    elif a == "くもり時々晴れ":
        message = "おはようございますっス！荒木比奈がお伝えする今日の天気予報っス\n"+tyear+"年"+tmonth+"月"+tday+"日の東京の天気は"+a+"っス！最高気温は"+high_temp_celsius_round+"度、最低気温は"+low_temp_celsius_round+"度っスよー。\n不安定な天気に注意っス。#ブルナポ朝の天気予報 #ブルナポ応援企画"
        print(message)
        pic = '/Users/iwanaga/Documents/weatherforecast/写真/荒木比奈/ah2.jpg'
    else:
        message = "おはようございますっス！荒木比奈がお伝えする今日の天気予報っス\n"+tyear+"年"+tmonth+"月"+tday+"日の東京の天気は"+a+"っス！最高気温は"+high_temp_celsius_round+"度、最低気温は"+low_temp_celsius_round+"度っスよー。\nプロデューサー、ちゃんと見てくれてるっスか？#ブルナポ朝の天気予報 #ブルナポ応援企画"
        print(message)
        pic = '/Users/iwanaga/Documents/weatherforecast/写真/荒木比奈/ah1.jpg'
else:
    print(pattern)


# In[19]:


if pattern == "ptc":
    if a == "雨":
        message = "おはようございますっ！。上条春菜です！今日の天気予報をお伝えしますっ！\n"+tyear+"年"+tmonth+"月"+tday+"日の東京の天気は"+a+"です。最高気温は"+high_temp_celsius_round+"度、最低気温は"+low_temp_celsius_round+"度です！\nたとえ雨で濡れてもメガネは外しませんっ！#ブルナポ朝の天気予報 #ブルナポ応援企画"
        print(message)
        pic = '/Users/iwanaga/Documents/weatherforecast/写真/上条春菜/kh4.jpg'
    elif a == "晴れ":
        message = "おはようございますっ！。上条春菜です！\n"+tyear+"年"+tmonth+"月"+tday+"日の東京の天気は"+a+"です。最高気温は"+high_temp_celsius_round+"度、最低気温は"+low_temp_celsius_round+"度です！\nプロデューサーさん！日差しには眼鏡が１番ですよっ！#ブルナポ朝の天気予報 #ブルナポ応援企画"
        print(message)
        pic = '/Users/iwanaga/Documents/weatherforecast/写真/上条春菜/kh3.jpg'
    elif a == "雪":
        message = "おはようございますっ！。上条春菜です！今日の天気予報をお伝えしますっ！\n"+tyear+"年"+tmonth+"月"+tday+"日の東京の天気は"+a+"です。最高気温は"+high_temp_celsius_round+"度、最低気温は"+low_temp_celsius_round+"度です！\nささ、サンタ春菜からのプレゼント眼鏡をどうぞ！#ブルナポ朝の天気予報 #ブルナポ応援企画"
        print(message)
        pic = '/Users/iwanaga/Documents/weatherforecast/写真/上条春菜/kh5.jpg'
    elif a == "くもり時々晴れ":
        message = "おはようございますっ！。上条春菜です！今日の天気予報をお伝えしますっ！\n"+tyear+"年"+tmonth+"月"+tday+"日の東京の天気は"+a+"です。最高気温は"+high_temp_celsius_round+"度、最低気温は"+low_temp_celsius_round+"度です！\n空が曇っていても私の眼鏡は曇りませんよ！#ブルナポ朝の天気予報 #ブルナポ応援企画"
        print(message)
        pic = '/Users/iwanaga/Documents/weatherforecast/写真/上条春菜/kh5.jpg'
    else:
        message = "おはようございますっ！。上条春菜です！今日の天気予報をお伝えしますっ！\n"+tyear+"年"+tmonth+"月"+tday+"日の東京の天気は"+a+"です。最高気温は"+high_temp_celsius_round+"度、最低気温は"+low_temp_celsius_round+"度です！\nさぁプロデューサーさん！眼鏡装着！あれ…わたしだけ！？#ブルナポ朝の天気予報 #ブルナポ応援企画"
        print(message)
        pic = '/Users/iwanaga/Documents/weatherforecast/写真/上条春菜/kh1.jpg'
else:
    print(pattern)


# In[56]:


if pattern == "ptd":
    if a == "雨":
        message = "朝からごくろうさま♪松本沙理奈が今日の天気予報をお伝えするわよ！\n"+tyear+"年"+tmonth+"月"+tday+"日の東京の天気は"+a+"！最高気温は"+high_temp_celsius_round+"度、最低気温は"+low_temp_celsius_round+"度よ♪\nプロデューサー、傘♡忘れてない？#ブルナポ朝の天気予報 #ブルナポ応援企画"
        print(message)
        pic = '/Users/iwanaga/Documents/weatherforecast/写真/松本沙理奈/ms2.jpg'
    elif a == "晴れ":
        message = "朝からごくろうさま♪松本沙理奈が今日の天気予報をお伝えするわよ！\n"+tyear+"年"+tmonth+"月"+tday+"日の東京の天気は"+a+"！最高気温は"+high_temp_celsius_round+"度、最低気温は"+low_temp_celsius_round+"度よ♪\nよっし、今日もバッチリ！プロデューサーも頑張ってきてね♪#ブルナポ朝の天気予報 #ブルナポ応援企画"
        print(message)
        pic = '/Users/iwanaga/Documents/weatherforecast/写真/松本沙理奈/ms4.jpg'
    elif a == "強風":
        message = "朝からごくろうさま♪今日の天気予報をお伝えするわよ！\n"+tyear+"年"+tmonth+"月"+tday+"日の東京の天気は"+a+"！最高気温は"+high_temp_celsius_round+"度、最低気温は"+low_temp_celsius_round+"度よ♪\n昔のスーパースターのように、風は私をセクシーにしてくれるのよ♪#ブルナポ朝の天気予報 #ブルナポ応援企画"
        print(message)
        pic = '/Users/iwanaga/Documents/weatherforecast/写真/松本沙理奈/ms5.jpg'
    elif a == "くもり時々晴れ":
        message = "朝からごくろうさま♪今日の天気予報をお伝えするわよ！\n"+tyear+"年"+tmonth+"月"+tday+"日の東京の天気は"+a+"！最高気温は"+high_temp_celsius_round+"度、最低気温は"+low_temp_celsius_round+"度よ♪\nもう！はっきりしない天気ね！#ブルナポ朝の天気予報 #ブルナポ応援企画"
        print(message)
        pic = '/Users/iwanaga/Documents/weatherforecast/写真/松本沙理奈/ms7.jpg'
    else:
        message = "朝からごくろうさま♪松本沙理奈が今日の天気予報をお伝えするわよ！\n"+tyear+"年"+tmonth+"月"+tday+"日の東京の天気は"+a+"！最高気温は"+high_temp_celsius_round+"度、最低気温は"+low_temp_celsius_round+"度よ♪\nどう？私の魅力出てるかしら♪#ブルナポ朝の天気予報 #ブルナポ応援企画"
        print(message)
        pic = '/Users/iwanaga/Documents/weatherforecast/写真/松本沙理奈/ms1.jpg'
else:
    print(pattern)


# In[55]:


if pattern == "pte":
    if a == "雨":
        message = "おはようございますっ♪川島瑞樹が今日の天気をお知らせするわよ！"+tyear+"年"+tmonth+"月"+tday+"日の東京の天気は"+a+"、最高気温は"+high_temp_celsius_round+"度、最低気温は"+low_temp_celsius_round+"度よ♪\n\n雨の降る日が続いて肌寒くなる分、温泉に入りたくなるわね♪ #ブルナポ朝の天気予報　#ブルナポ応援企画"
        print(message)
        pic = '/Users/iwanaga/Documents/weatherforecast/写真/川島瑞樹/km8.jpg'
    elif a == "晴れ":
        message = "みんなおはようっ♪川島瑞樹が今日の天気をお伝えするわ！"+tyear+"年"+tmonth+"月"+tday+"日の東京の天気は"+a+"、最高気温は"+high_temp_celsius_round+"度、最低気温は"+low_temp_celsius_round+"度になるわよ！\n冬の日差しこそ天敵よね…わかるわ。#ブルナポ朝の天気予報　#ブルナポ応援企画"
        print(message)
        pic = '/Users/iwanaga/Documents/weatherforecast/写真/川島瑞樹/km7.jpg'
    elif a == "雪":
        message = "おはようございますっ♪...おほん！\n川島瑞樹が今日の天気をお伝えします。"+tyear+"年"+tmonth+"月"+tday+"日の東京の天気は"+a+"、最高気温は"+high_temp_celsius_round+"度、最低気温は"+low_temp_celsius_round+"度よ！\n冷えは女性の大敵なんだから…！ #ブルナポ朝の天気予報　#ブルナポ応援企画"
        print(message)
        pic = '/Users/iwanaga/Documents/weatherforecast/写真/川島瑞樹/km15.jpg'
    elif a == "くもり時々晴れ":
        message = "おはようございますっ♪\n川島瑞樹が今日の天気をお知らせするわ！"+tyear+"年"+tmonth+"月"+tday+"日の東京の天気は"+a+"、最高気温は"+high_temp_celsius_round+"度、最低気温は"+low_temp_celsius_round+"度よ！\nプロデューサー君も、気温の変化には気をつけてね #ブルナポ朝の天気予報　#ブルナポ応援企画"
        print(message)
        pic = '/Users/iwanaga/Documents/weatherforecast/写真/川島瑞樹/km5.jpg'
    else:
        message = "おはようございますっ♪...おほん！\n川島瑞樹が今日の天気をお伝えします。"+tyear+"年"+tmonth+"月"+tday+"日の東京の天気は"+a+"、最高気温は"+high_temp_celsius_round+"度、最低気温は"+low_temp_celsius_round+"度になるでしょう\n\n...あらやだ、局アナの頃より調子いいかも…！ #ブルナポ朝の天気予報　#ブルナポ応援企画"
        print(message)
        pic = '/Users/iwanaga/Documents/weatherforecast/写真/川島瑞樹/km4.jpg'
else:
    print("OK")


# In[22]:


auth = tweepy.OAuthHandler("Kwet0nyxsIv7FOIaRWeDXHzkF","blF1rKv0c75ha96pZI8dzZ2jccDPL4Aksrt5PlIktwoN8Aq3MC")
auth.set_access_token("1072666798657429504-CBMwvToplcGiaBKsS8Abh4xLSnxRGi","czFoC4pz8AbrozQ3KQlKWdPaDn1D5KCeQSXySrnG8f0fV")
api = tweepy.API(auth)


# In[23]:


api.update_with_media(filename = pic, status = message)


# In[ ]:
