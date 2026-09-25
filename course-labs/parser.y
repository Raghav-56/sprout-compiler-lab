%{
#include <ctype.h>
#include <stdio.h>

int yylex(void);
void yyerror(const char *message);
%}

%union {
    long number;
}

%token <number> NUMBER
%type <number> expr
%left '+' '-'
%left '*' '/'

%%
input:
    /* empty */
  | input '\n'
  | input expr '\n' { printf("%ld\n", $2); }
  ;

expr:
    NUMBER             { $$ = $1; }
  | '(' expr ')'       { $$ = $2; }
  | expr '+' expr      { $$ = $1 + $3; }
  | expr '-' expr      { $$ = $1 - $3; }
  | expr '*' expr      { $$ = $1 * $3; }
  | expr '/' expr      {
        if ($3 == 0) {
            yyerror("division by zero");
            YYERROR;
        }
        $$ = $1 / $3;
    }
  ;
%%

int yylex(void) {
    int character;
    do {
        character = getchar();
    } while (character == ' ' || character == '\t' || character == '\r');

    if (isdigit(character)) {
        long value = 0;
        do {
            value = value * 10 + (character - '0');
            character = getchar();
        } while (isdigit(character));
        if (character != EOF) {
            ungetc(character, stdin);
        }
        yylval.number = value;
        return NUMBER;
    }
    return character == EOF ? 0 : character;
}

void yyerror(const char *message) {
    fprintf(stderr, "%s\n", message);
}

int main(void) {
    return yyparse();
}
