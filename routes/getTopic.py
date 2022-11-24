import sys
from konlpy.tag import Mecab

def getName(title):
    #print ("title to extract product name is ",title)

    try:
        mecab = Mecab()
        #mecab = Mecab("/opt/homebrew/lib/mecab/dic/mecab-ko-dic")
        
        result = mecab.pos(title)
        answer=""
        frequent = ['같이', '사실','사요','분','구해','kg','소분','g','씩','사서','하나','cm','판매','봉','ml','L']
        if '몰티져스' in title:
            answer = '몰티져스'
        else:
            for x in result[:]:
                if ('+' in x[1]) or (x[1] == 'MAG') or (x[1] == 'SF') or ('NNB' in x[1]) or (x[1] == 'SN')or (x[1] == 'SY')or (x[1] == 'XSV')or (x[0]in frequent) or (x[1] == 'SC')or (x[1] == 'JKB'):
                    result.remove(x)
            for x in result:
                answer+=x[0]
            if '(인당)' in answer:
                answer=answer.replace('인당','')
        if(answer==""):
            answer="오류발생"
        
        print(answer,end='')
    except:
        print('오류발생',end='')

    


if __name__ == '__main__':
    getName(sys.argv[1])