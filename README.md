# Eksempler
Eksempler på åben data visualiseringer der frit kan bruges

## Dokk1

### Visualisering af besøgende baseret på tællekamera
Denne visualisering er baseret på de tælle-kameraer der er installere på Dokk1 i Aarhus. Visualiseringen bliver genereret dynamisk baseret på de seneste historiske data (er et par dage forsinket ift dags dato). Se information om brug nedenfor.

`<script src="https://cdn.jsdelivr.net/gh/Datakollektivet/eksempler/Dokk1-visitors-day-simple.js" type="application/javascript"></script>`

## Principper og brug

Alle eksemplerne på denne side kan frit bruges som de er ved at inkludere JavaScript filen på et website. Scriptet skal inkluderes i et kontainer element og vil automatisk blive tilpasset kontainerens bredde. Eksempel:

```
<div id="visualiserings-kontainer" style="width:1000px;">
  <script src="dokk1-visitor-flow.js" type="application/javascript"></script>
</div>
```

Da alle visualiseringerne er lavet på Dansk, så er det nødvendigt at siden de bliver indlejret på er sat op til UTF-8 ` <meta http-equiv="Content-Type" content="text/html; charset=utf-8">`

### Kilde og baggrund
Vi har som princip at alle visualiseringer skal komme med kilder til data og kode, samt en beskrivelse af design processen og eventuelle forbehold og mulige fejlkilder. Det muliggør at andre kan se hvilke data visualiseringen er baseret på, hvordan data er behandlet og tankerne bag. Det tjener til gennemsigtighed og inspiration -- du må gerne tage udgangspunkt i materiale og lave noget bedre eller stille spørgsmål til designet. 

Alle eksemplerne kommer derfor med links til en data beskrivelse, selve kilden, koden der genererer visualiseringen, samt to indlæg der beskriver forbehold og design processen.

### Fejl
Alle eksemplerne er konstrueret således at de selv henter de data og ressourcer, som er nødvendige. Der kan opstå fejl hvis enten data eller ressourcerne er utilgængelige -- det holder vi selvfølgelig øje med, men du må gerne hjælpe med at rapportere fejl. Eksemplerne vil også melde fejl, hvis siden de er indlejret på ikke understøtter UTF-8 (se ovenfor).

