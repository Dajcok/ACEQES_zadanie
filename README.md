# Testovacie zadanie pre ACEQES s.r.o.

Pôvodné [inštrukcie](https://docs.google.com/document/d/1k9kGzZOaMfTXaO_MAufO6TwvsUbA3t3klFXxpf8_hwU/edit)

## Inštalácia

Odporúčaná verzia node: v18.13.0

```bash
npm install
```


## Spustenie

```bash
npm run dev
```

## Spustenie testov

Súčasťou balíka je séria integračných testov, ktorá demonštruje fungovanie aplikácie a pokrýva rôzne test cases podľa zadania. V reálnom svete by okrem integračných testov boli aj unit testy, kt. by viac kontrolovane testovali jednotlivé časti aplikácie. Pre tieto účely som sa ich však rozhodol nepísať.

```bash
npm run test
```

Okrem testov je súčasťou balíka aj zadanie.postman_collection.json - je to set requestov exportovaných z postmana, ktoré si môžete nakonfigurovať podľa vlastného uváženia a pretestovať API mimo testov, ak to je potrebné