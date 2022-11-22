import sys
from konlpy.tag import Mecab

def getName(title):
    #print ("title to extract product name is ",title)
    mecab = Mecab()
    result = mecab.pos(title)
    endOfI = 0
    answer=""
    if(len(result)>1):
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