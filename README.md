# joulujuttuPeli 🎄

Jouluinen peli, jossa keräät putoavia joululahjoja!

## Kuvaus

Tämä on hauska jouluteemainen peli, jossa ohjaat joulupukkia (🎅) ja yrität kerätä taivaalta putoavia joululahjoja. Jokainen kerätty lahja antaa yhden pisteen, ja sinulla on kolme elämää. Menetät elämän, jos annat lahjan pudota maahan!

## Ominaisuudet

- 🎅 Ohjaa joulupukkia nuolinäppäimillä tai A/D-näppäimillä
- 🎁 Kerää erilaisia joululahjoja, joilla on eri vaikutukset:
  - 🎁 **Lahja**: 1 piste
  - 🎀 **Rusetti**: 2 pistettä
  - ⭐ **Tähti**: 3 pistettä
  - 🔔 **Kello**: Hidastaa kaikkien lahjojen putoamista 3 sekunniksi
  - 🎄 **Kuusi**: Antaa yhden lisäelämän (maksimi 3 elämää)
- ⭐ Peli vaikeutuu progressiivisesti - lahjat putoavat nopeammin pisteiden karttuessa
- 🔥 Combo-järjestelmä - saat bonuspisteitä peräkkäisistä kiinni otetuista lahjoista
- 🎨 Kaunis jouluinen teema vihreällä taustalla ja animoiduilla lumihiutaleilla
- ❤️ Kolme elämää - yritä kerätä mahdollisimman monta lahjaa!
- ⏸️ Pauseta peli välilyönnillä tai P-näppäimellä
- 🏆 Ennätysten seuranta - paras pisteesi tallentuu automaattisesti
- 💫 Visuaalisia efektejä - partikkelit ja pistepopupit lahjojen keräämisestä
- 📊 Tasojärjestelmä - näet nykyisen vaikeustason pelin aikana

## Kuinka pelata

1. Avaa `index.html` tiedosto web-selaimessa
2. Paina "Aloita Peli" -nappia
3. Käytä nuolinäppäimiä (← →) tai A ja D -näppäimiä liikkuaksesi vasemmalle ja oikealle
4. Kerää putoavat joululahjat liikuttamalla joulupukkia niiden alle
5. Älä anna lahjojen pudota maahan - menetät elämän!
6. **UUSI!** Paina VÄLILYÖNTIÄ tai P pysäyttääksesi pelin
7. Rakenna combo keräämällä peräkkäisiä lahjoja ilman missauksia saadaksesi bonuspisteitä!
8. Peli päättyy, kun kaikki kolme elämää on menetetty

### Pisteytys
- 🎁 Lahja: 1 piste
- 🎀 Rusetti: 2 pistettä
- ⭐ Tähti: 3 pistettä
- 🔔 Kello: 1 piste + hidastaa putoamista 3 sekunniksi
- 🎄 Kuusi: 1 piste + 1 lisäelämä (jos elämät < 3)
- Combo bonus: +1 piste joka 5. peräkkäisestä kiinni otetusta lahjasta
- Vaikeus kasvaa: Joka 10. pisteen jälkeen lahjat putoavat nopeammin ja ilmestyvät tiheämmin

## Tekninen toteutus

- **HTML5 Canvas** - Pelin grafiikka
- **JavaScript** - Pelin logiikka ja mekaniikka
- **CSS3** - Jouluinen tyylittely ja animaatiot
- Täysin toimiva selaimessa ilman ulkoisia riippuvuuksia

## Pelaaminen paikallisesti

Voit pelata peliä avaamalla `index.html` tiedoston suoraan selaimessa tai käynnistämällä paikallisen web-palvelimen:

```bash
# Python 3
python3 -m http.server 8000

# Sitten avaa selain osoitteeseen:
# http://localhost:8000
```

Hyvää joulua ja hauskaa pelaamista! 🎄🎁