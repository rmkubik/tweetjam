pico-8 cartridge // http://www.pico-8.com
version 16
__lua__
x=1
c=cos s=sin
m="happy valentines day !"
::a::flip()cls(14)for i=0,20 do
pal(8,i*8)v=.92*i+x
?"♥",6*i,19+2*c(v),8
?"♥",6*i,104-2*c(v)
pal(8,x%8)
?m,20,60
?m,20,62
?m,21,61 
?m,19,61
pal()v=i+.3*x
?m,20,61,8
?"♪",6+4*c(v),60+4*s(v)
?"♪",114+4*c(v),60+4*s(v)
end
x+=.075
goto a
