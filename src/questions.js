// ===================================================================
//  De 15 vragen — AI-buzzword quiz (Nederlands)
// ===================================================================
//  Volgorde = oplopende moeilijkheid: eerst 7x PITTIG, daarna 8x EXPERT.
//  Per vraag 4 opties:
//    - precies één met  correct: true   (het juiste antwoord)
//    - precies één met  joke: true      (de grappige afleider)
//    - de overige twee zijn plausibele afleiders
//  De weergavevolgorde van de 4 opties wordt PER SESSIE gehusseld
//  (zie shuffle.js). Hier staat de "bron"-volgorde; welke correct is
//  wordt via de vlag bijgehouden, niet via de positie.
// ===================================================================

export const QUESTIONS = [
  // ---------------------------- PITTIG ----------------------------
  {
    term: 'Fine-tunen',
    level: 'PITTIG',
    options: [
      { text: 'Een bestaand, al getraind AI-model verder trainen op specifieke data zodat het beter presteert op een bepaalde taak.', correct: true },
      { text: 'Een model volledig vanaf nul opnieuw trainen met een schone dataset.' },
      { text: 'Het verlagen van de rekenkracht die een model gebruikt om energie te besparen.' },
      { text: 'De radio in het datacenter net zo lang bijstellen tot de ruis weg is.', joke: true },
    ],
    explanation:
      'Fine-tunen bouwt voort op een al getraind model en specialiseert het met eigen data — veel goedkoper dan vanaf nul trainen.',
  },
  {
    term: 'Hallucinatie',
    level: 'PITTIG',
    options: [
      { text: 'Wanneer een model met overtuiging informatie presenteert die feitelijk onjuist of verzonnen is.', correct: true },
      { text: 'Een bug waarbij het model hetzelfde antwoord eindeloos blijft herhalen.' },
      { text: 'Wanneer een model weigert antwoord te geven op een gevoelige vraag.' },
      { text: 'Het moment waarop de AI begint te dromen over elektrische schapen.', joke: true },
    ],
    explanation:
      'Een hallucinatie is verzonnen maar zelfverzekerd gebrachte onzin — bijv. een niet-bestaande bron of feit. Altijd checken dus.',
  },
  {
    term: 'RAG (Retrieval-Augmented Generation)',
    level: 'PITTIG',
    options: [
      { text: 'De AI zoekt eerst relevante informatie op in een externe bron en gebruikt die om een onderbouwd antwoord te genereren.', correct: true },
      { text: 'Een methode om meerdere modellen hetzelfde te laten beantwoorden en de antwoorden te middelen.' },
      { text: 'Het comprimeren van een model zodat het op een telefoon past.' },
      { text: 'Een oude lap stof waarmee technici stoffige servers afnemen.', joke: true },
    ],
    explanation:
      'Bij RAG haalt het systeem eerst relevante documenten op en genereert daarmee een onderbouwd antwoord — handig tegen hallucinaties en voor eigen data.',
  },
  {
    term: 'Embedding',
    level: 'PITTIG',
    options: [
      { text: 'Een numerieke representatie (vector) van tekst of data, waarmee een model betekenis en gelijkenis kan berekenen.', correct: true },
      { text: 'Het permanent opslaan van een heel gesprek in het geheugen van het model.' },
      { text: 'Een stukje code dat een AI-widget in je website plaatst.' },
      { text: 'Het onderbrengen van een journalist bij een AI-startup om verslag te doen.', joke: true },
    ],
    explanation:
      'Een embedding zet data om in getallen (een vector). Teksten met vergelijkbare betekenis krijgen vergelijkbare vectoren — de basis van semantisch zoeken.',
  },
  {
    term: 'Temperature',
    level: 'PITTIG',
    options: [
      { text: 'Een instelling die bepaalt hoe voorspelbaar of juist creatief/willekeurig de output van een model is.', correct: true },
      { text: 'De maximale lengte van een antwoord dat het model mag genereren.' },
      { text: 'Een maat voor hoe zeker het model is van zijn antwoord, in procenten.' },
      { text: 'De werktemperatuur van de datacenterkoeling, in graden Celsius.', joke: true },
    ],
    explanation:
      'Lage temperature = voorspelbaar en consistent; hoge temperature = creatiever maar grilliger.',
  },
  {
    term: 'Overfitting',
    level: 'PITTIG',
    options: [
      { text: 'Wanneer een model de trainingsdata te veel "uit het hoofd leert" en daardoor slecht presteert op nieuwe, ongeziene data.', correct: true },
      { text: 'Wanneer een model te groot is om op de beschikbare hardware te draaien.' },
      { text: 'Het toevoegen van zoveel data dat training extreem traag wordt.' },
      { text: 'Wanneer een model zó enthousiast is dat het meer antwoorden geeft dan gevraagd.', joke: true },
    ],
    explanation:
      'Een overfit model kent de voorbeelden uit z\'n hoofd maar generaliseert slecht. Je merkt het als het perfect scoort op trainingsdata maar faalt op nieuwe data.',
  },
  {
    term: 'Chain-of-thought',
    level: 'PITTIG',
    options: [
      { text: 'Het model stap voor stap laten redeneren, zodat het complexe vragen betrouwbaarder oplost.', correct: true },
      { text: 'Een reeks modellen die elkaars output als input gebruiken in een pijplijn.' },
      { text: 'De volgorde waarin trainingsdata aan een model wordt aangeboden.' },
      { text: 'Een groepsapp waarin AI-modellen elkaar de hele dag berichten doorsturen.', joke: true },
    ],
    explanation:
      'Door het model hardop stap voor stap te laten denken worden vooral reken- en redeneervragen betrouwbaarder.',
  },

  // ---------------------------- EXPERT ----------------------------
  {
    term: 'Transformer',
    level: 'EXPERT',
    options: [
      { text: 'De neurale netwerk-architectuur (gebaseerd op "attention") die aan de basis ligt van vrijwel alle moderne taalmodellen.', correct: true },
      { text: 'Een model dat uitsluitend afbeeldingen genereert op basis van tekst.' },
      { text: 'Een techniek om grote modellen kleiner te maken zonder kwaliteitsverlies.' },
      { text: 'Een robot uit een bekende filmreeks die zich in een vrachtwagen verandert.', joke: true },
    ],
    explanation:
      'De transformer (2017, "Attention is all you need") is de architectuur achter GPT, Claude en co.',
  },
  {
    term: 'RLHF (Reinforcement Learning from Human Feedback)',
    level: 'EXPERT',
    options: [
      { text: 'Een model bijsturen op basis van menselijke voorkeuren, zodat de output nuttiger en veiliger wordt.', correct: true },
      { text: 'Het automatisch labelen van trainingsdata zonder tussenkomst van mensen.' },
      { text: 'Een methode om modellen sneller te maken door overbodige lagen te verwijderen.' },
      { text: 'Een beloningssysteem waarbij het model complimentjes krijgt en daar blij van wordt.', joke: true },
    ],
    explanation:
      'Mensen beoordelen antwoorden, en die voorkeuren worden gebruikt om het model bij te sturen richting nuttiger en veiliger gedrag.',
  },
  {
    term: 'Mixture of Experts (MoE)',
    level: 'EXPERT',
    options: [
      { text: 'Een architectuur met meerdere gespecialiseerde subnetwerken ("experts"), waarbij per invoer alleen de relevante experts worden geactiveerd.', correct: true },
      { text: 'Een aanpak waarbij meerdere losse modellen stemmen over het beste antwoord.' },
      { text: 'Een trainingsmethode waarbij menselijke experts elke vraag nakijken.' },
      { text: 'Een adviescommissie van AI-onderzoekers die per e-mail ruziet over definities.', joke: true },
    ],
    explanation:
      'Bij MoE staan veel "expert"-subnetwerken klaar, maar per token wordt maar een klein deel geactiveerd. Veel capaciteit tegen relatief lage rekenkosten.',
  },
  {
    term: 'Diffusion model',
    level: 'EXPERT',
    options: [
      { text: 'Een techniek achter veel beeldgeneratoren: begint met ruis en verfijnt die stap voor stap tot een beeld.', correct: true },
      { text: 'Een model dat tekst over meerdere servers verspreidt voor snellere verwerking.' },
      { text: 'Een methode om kennis van een groot model over te dragen naar een klein model.' },
      { text: 'De snelheid waarmee een nieuw AI-buzzword zich over kantoor verspreidt.', joke: true },
    ],
    explanation:
      'Diffusiemodellen (zoals achter veel beeld-AI) leren ruis stap voor stap terug te vormen tot een coherent beeld.',
  },
  {
    term: 'Quantization (kwantisatie)',
    level: 'EXPERT',
    options: [
      { text: 'Een model compacter en sneller maken door de getallen (gewichten) met minder precisie op te slaan.', correct: true },
      { text: 'Het opdelen van een grote vraag in kleinere deelvragen.' },
      { text: 'Het meten van hoeveel vragen een model per seconde aankan.' },
      { text: 'Het omrekenen van AI-kosten naar het aantal benodigde kopjes koffie.', joke: true },
    ],
    explanation:
      'Door gewichten in lagere precisie (bv. 8-bit i.p.v. 16-bit) op te slaan wordt een model kleiner en sneller, met beperkt kwaliteitsverlies.',
  },
  {
    term: 'Knowledge distillation',
    level: 'EXPERT',
    options: [
      { text: 'Een klein "student"-model trainen om het gedrag van een groot "leraar"-model na te bootsen.', correct: true },
      { text: 'Het filteren van onbetrouwbare bronnen uit de trainingsdata.' },
      { text: 'Het samenvatten van lange documenten tot kernpunten.' },
      { text: 'Het proces waarbij een model \'s nachts alles wat het geleerd heeft weer vergeet.', joke: true },
    ],
    explanation:
      'Distillatie perst de kennis van een groot model in een kleiner, sneller model dat bijna net zo goed presteert.',
  },
  {
    term: 'Prompt injection',
    level: 'EXPERT',
    options: [
      { text: 'Een aanvalstechniek waarbij iemand verborgen instructies in de input verstopt om een model te misleiden.', correct: true },
      { text: 'Het automatisch verbeteren van een slecht geformuleerde prompt.' },
      { text: 'Het injecteren van extra rekenkracht om een antwoord te versnellen.' },
      { text: 'Een spuitje waarmee je het model wakker maakt als het traag reageert.', joke: true },
    ],
    explanation:
      'Bij prompt injection worden kwaadaardige instructies verstopt (bv. in een webpagina of document) zodat het model iets doet wat de gebruiker niet wil.',
  },
  {
    term: 'Agentic AI',
    level: 'EXPERT',
    options: [
      { text: 'AI-systemen die zelfstandig meerdere stappen plannen en tools/acties uitvoeren om een doel te bereiken, in plaats van alleen te antwoorden.', correct: true },
      { text: 'AI die speciaal is getraind om als klantenservicemedewerker te reageren.' },
      { text: 'Een model dat namens een bedrijf juridische contracten ondertekent.' },
      { text: 'Een AI met een eigen impresariaat dat auditie doet voor filmrollen.', joke: true },
    ],
    explanation:
      'Agentic AI plant, gebruikt tools en voert meerdere stappen uit richting een doel — het "doet" dingen in plaats van alleen antwoorden te geven.',
  },
]

export const TOTAL_QUESTIONS = QUESTIONS.length
