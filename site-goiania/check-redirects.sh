#!/usr/bin/env bash
# Checks the goiania -> Tape Pro redirect map (nginx.conf).
#   bash site-goiania/check-redirects.sh https://goiania.roilabs.com.br
#   bash site-goiania/check-redirects.sh http://localhost:8089   # local nginx container
# Every old sitemap URL must 301 straight to a Tape URL that answers 200 (one hop, no chain).
set -u
BASE="${1:?usage: check-redirects.sh <base-url>}"
T=https://tapepro.roilabs.com.br
fail=0

hit() { curl -s -o /dev/null -w "%{http_code} %{redirect_url}" "$BASE$1"; }
check() {
  local got; got=$(hit "$1"); got=${got% }
  if [ "$got" != "$2" ]; then echo "FAIL $1 -> '$got' (expected '$2')"; fail=1; fi
}

while read -r path want; do check "$path" "$want"; done <<EOF
/ 301 $T/
/fitas/ 301 $T/produtos/
/fitas 301 $T/produtos/
/fitas/fita-gomada/ 301 $T/produtos/fita-gomada/
/fitas/fita-gomada 301 $T/produtos/fita-gomada/
/fitas/fita-transparente-personalizada/ 301 $T/produtos/fita-transparente-personalizada/
/fitas/fita-transparente-comum/ 301 $T/produtos/fita-transparente-comum/
/fitas/outra/ 301 $T/produtos/
/fitasx/ 301 $T/
/guia/como-escolher-fita-adesiva-para-embalagem/ 301 $T/blog/como-escolher-fita-para-caixa-pesada/
/guia/como-escolher-porcelanato/ 301 $T/
/porcelanato/ 301 $T/
/orcamento/ 301 $T/orcamento/
/carrinho/ 301 $T/orcamento/
/carrinho-fitas/ 301 $T/orcamento/
/sobre/ 301 $T/sobre/
/pedido/?t=abc 301 $T/
/mana/produto/x 301 https://mana.roilabs.com.br/produto/x
/robots.txt 200
/sitemap.xml 200
/BingSiteAuth.xml 200
EOF

# Sweep: every URL in the old sitemap lands on a live Tape page in one hop.
urls=$(curl -s "$BASE/sitemap.xml" | grep -o "<loc>[^<]*</loc>" | sed -e 's/<[^>]*>//g' -e 's#https://goiania.roilabs.com.br##')
n=$(echo "$urls" | grep -c .)
[ "$n" -gt 0 ] || { echo "FAIL old sitemap is empty"; fail=1; }
targets=$(for p in $urls; do
  read -r code loc <<<"$(hit "$p")"
  if [ "$code" != 301 ] || [ "${loc#"$T"/}" = "$loc" ]; then echo "FAIL $p -> $code $loc" >&2; echo FAIL; else echo "$loc"; fi
done | sort -u)
echo "$targets" | grep -q FAIL && fail=1
for t in $targets; do
  [ "$t" = FAIL ] && continue
  c=$(curl -s -o /dev/null -w "%{http_code}" "$t")
  [ "$c" = 200 ] || { echo "FAIL target $t -> $c"; fail=1; }
done

[ $fail = 0 ] && echo "OK: $n sitemap URLs + table, $(echo "$targets" | grep -c .) Tape targets answer 200"
exit $fail
