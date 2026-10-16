# Batterie ADHD sovrapposte — modulo unico compilabile

## Il problema, in numeri

Una batteria ADHD per adulti del tipo più diffuso — ASRS-18, DIVA-5, BAARS-IV (sintomi attuali e dell'infanzia), WURS, WHODAS 2.0, BDI-II, Zung, BRIEF-A — contiene 312 domande, di cui 90 sulle stesse 18 voci DSM-5: quattro strumenti chiedono gli stessi sintomi con parole diverse. Il modulo unico le porta a 258, e i 18 sintomi si compilano due volte in tutto — età adulta e infanzia — invece di sei.

## Quando si fonde, e quando no

Un item si può fondere con un altro solo se valgono tutte e tre le condizioni: stesso costrutto, stessa finestra di rievocazione, scala di risposta convertibile senza forzature. BDI-II (2 settimane), Zung (1 settimana) e WHODAS 2.0 (30 giorni) restano separati anche se parlano di cose vicine: fonderli renderebbe i punteggi ininterpretabili.

## Gli strumenti e le derivazioni

Compilati una volta sola: i 18 criteri DSM-5 per l'età adulta (ultimi 6 mesi), gli stessi 18 per l'età infantile (5-12 anni), WURS (61 item, 8-10 anni), WHODAS 2.0 (36 item, ultimi 30 giorni), Zung (20 item, ultima settimana), anamnesi essenziale e osservazioni libere.

Ricavati dai due blocchi: ASRS-18 (identità, scala 0-4), BAARS-IV sintomi attuali e dell'infanzia, colonna età adulta e colonna età infantile della griglia DIVA-5, corroborazione del familiare sui 18 sintomi, soglie esplicite Sì/No («≥ Talvolta», «≥ Spesso»).

## Cosa scaricare

- [Modulo unico per il paziente](https://savianu.it/colleghi/adhd/modulo-unico-adhd.html) — HTML autoconsistente, 153 voci chiuse più anamnesi
- [Modulo per un familiare](https://savianu.it/colleghi/adhd/modulo-familiare-adhd.html) — HTML, 18 sintomi, impatto sui domini e 15 domande guidate
- [Mappatura item → scala](https://savianu.it/colleghi/adhd/mappatura.json) — JSON con derivazioni, scale e soglie

## Come si consegna il modulo

Il file HTML non contiene le risposte: è solo il modulo. Le risposte restano nell'archivio locale del browser del dispositivo su cui viene aperto, quindi vanno esportate («Scarica .json» oppure «Mostra testo → Copia») e consegnate. Rimandare il file non serve: viaggia vuoto. Il modulo per il familiare produce già un report leggibile, pronto da allegare alla visita.

## Cosa non contiene, e perché

BDI-II, BAARS-IV e BRIEF-A non sono riprodotti: sono strumenti a licenza commerciale (Pearson, Hogrefe, PAR) e le loro voci non possono essere ripubblicate. La mappatura contiene la corrispondenza item → voce; le tre sezioni si compilano dai moduli originali in possesso del collega.

## Privacy e limiti

Nessuna risorsa esterna, nessuna chiamata di rete, nessun tracciamento; le risposte restano sul dispositivo del paziente finché non le consegna. È uno strumento di raccolta, non di valutazione: non produce punteggi, non fa diagnosi e non sostituisce il colloquio clinico. Le risposte derivate per gli strumenti non somministrati direttamente vanno lette come equivalenze dichiarate, non come somministrazioni.
