import sys
from konlpy.tag import Mecab

def getName(title):
    #print ("title to extract product name is ",title)
    mecab = Mecab()
    result = mecab.pos(title)
    endOfI = 0
    answer=""
    #result = [('진라면', 'NNP'), ('매운맛', 'NNG'), ('40', 'SN'), ('봉지', 'NNBC'), ('20', 'SN'), ('봉지', 'NNBC'), ('씩', 'XSN'), ('소분', 'NNG'), ('하', 'XSV'), ('실', 'EP+ETM'), ('분', 'NNB'), ('!', 'SF')]

    for i,x in enumerate(result):
        if (x[1] == 'SL')or (x[1] == 'NNG')or (x[1] == 'NNP'):
             if (result[i + 1][1] == 'SL')or (result[i + 1][1] == 'NNG')or (result[i + 1][1] == 'NNP'):
                 answer+=x[0]
                 answer+=" "
             else:
                endOfI = i
                answer+=result[endOfI][0]
                break

    if ((endOfI == len(result)-1)and((result[len(result)-1][1]=='SL')or(result[len(result)-1][1]=='NNG')or(result[len(result)-1][1]=='NNP'))):
        answer+=result[len(result)-1][0]
    #print(mecab.pos(title))
    print(answer,end='')
    return answer

if __name__ == '__main__':
    getName(sys.argv[1])