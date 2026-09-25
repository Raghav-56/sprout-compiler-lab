%option noyywrap nodefault yylineno

%{
#include <stdio.h>
%}

%%
"let"                         { printf("LET %s\n", yytext); }
"return"                      { printf("RETURN %s\n", yytext); }
"int"                         { printf("TYPE_INT %s\n", yytext); }
[0-9]+                        { printf("INT %s\n", yytext); }
[A-Za-z_][A-Za-z_0-9]*        { printf("IDENT %s\n", yytext); }
":"                           { printf("COLON %s\n", yytext); }
"="                           { printf("EQUAL %s\n", yytext); }
";"                           { printf("SEMICOLON %s\n", yytext); }
[ \t\r\n]+                    { }
.                             { fprintf(stderr, "line %d: invalid character %s\n", yylineno, yytext); return 1; }
%%

int main(void) {
    return yylex();
}
