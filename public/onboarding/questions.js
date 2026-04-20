// Question definitions. Single source of truth for both languages.
// Each question: { id, section, kind, required, deps?, ...copy (NL/EN) }
// kinds: 'commit' | 'text-group' | 'single' | 'multi' | 'long' | 'number' | 'composite'

window.SECTIONS = [
  { id: 1, nl: 'Persoonsgegevens', en: 'Personal details' },
  { id: 2, nl: 'Organisatie', en: 'Organisation' },
  { id: 3, nl: 'Jouw bijdrage', en: 'Your contribution' },
  { id: 4, nl: 'Verdieping', en: 'Follow-ups' },
  { id: 5, nl: 'Naam & logo', en: 'Name & logo' },
  { id: 6, nl: 'Motivatie', en: 'Motivation' },
  { id: 7, nl: 'Voorprogramma', en: 'Pre-programme' },
  { id: 8, nl: 'Ondertekenen', en: 'Sign' },
];

window.QUESTIONS = [
  // ---- SECTION 1 ----
  {
    id: 'contact', section: 1, kind: 'text-group', required: true,
    nl: { title: 'Vertel ons wie je bent',
      help: 'Wij gebruiken je gegevens alleen om contact op te nemen over de samenwerkingsverklaring.',
      fields: [
        { key: 'firstName', label: 'Voornaam', type: 'text' },
        { key: 'lastName', label: 'Achternaam', type: 'text' },
        { key: 'phone', label: 'Telefoonnummer', type: 'tel', optional: true },
        { key: 'email', label: 'E-mailadres', type: 'email' },
      ]},
    en: { title: 'Tell us who you are',
      help: 'We use your details only to reach you about the collaboration statement.',
      fields: [
        { key: 'firstName', label: 'First name', type: 'text' },
        { key: 'lastName', label: 'Last name', type: 'text' },
        { key: 'phone', label: 'Phone', type: 'tel', optional: true },
        { key: 'email', label: 'Email address', type: 'email' },
      ]},
  },
  {
    id: 'behalfOf', section: 1, kind: 'single', required: true,
    nl: { title: 'Ik vul dit formulier in namens:',
      help: 'Beiden zijn welkom. Je antwoord bepaalt welke vragen volgen.',
      options: [
        { value: 'self', label: 'Mijzelf', sub: 'Als privépersoon' },
        { value: 'org', label: 'Mijn organisatie', sub: 'Als vertegenwoordiger' },
      ]},
    en: { title: 'I am completing this form on behalf of:',
      help: 'Both are welcome. Your answer determines the next questions.',
      options: [
        { value: 'self', label: 'Myself', sub: 'As a private individual' },
        { value: 'org', label: 'My organisation', sub: 'As a representative' },
      ]},
  },

  // ---- SECTION 2 (only if behalfOf = org) ----
  {
    id: 'orgDetails', section: 2, kind: 'text-group', required: true,
    deps: (a) => a.behalfOf === 'org',
    nl: { title: 'Gegevens van jouw organisatie',
      help: 'De officiële gegevens van de organisatie namens wie je tekent.',
      fields: [
        { key: 'orgName', label: 'Naam organisatie', type: 'text' },
        { key: 'orgRole', label: 'Jouw functie en rol', type: 'text' },
        { key: 'orgEmail', label: 'E-mail organisatie', type: 'email' },
        { key: 'orgPhone', label: 'Telefoon organisatie', type: 'tel', optional: true },
        { key: 'orgAddress', label: 'Adres organisatie', type: 'text', wide: true, optional: true },
      ]},
    en: { title: 'Details of your organisation',
      help: 'The official details of the organisation on whose behalf you are signing.',
      fields: [
        { key: 'orgName', label: 'Organisation name', type: 'text' },
        { key: 'orgRole', label: 'Your role', type: 'text' },
        { key: 'orgEmail', label: 'Organisation email', type: 'email' },
        { key: 'orgPhone', label: 'Organisation phone', type: 'tel', optional: true },
        { key: 'orgAddress', label: 'Organisation address', type: 'text', wide: true, optional: true },
      ]},
  },
  {
    id: 'orgType', section: 2, kind: 'single', required: true,
    deps: (a) => a.behalfOf === 'org',
    nl: { title: 'Welk type organisatie vertegenwoordig jij?',
      help: 'Je organisatietype is zichtbaar in het gemeenteoverzicht — niet jouw naam.',
      columns: 2,
      options: [
        { value: 'buurthuis', label: 'Buurthuis of wijkcentrum' },
        { value: 'cultureel', label: 'Culturele broedplaats' },
        { value: 'azc', label: 'AZC of COA' },
        { value: 'welzijn', label: 'Welzijnsorganisatie' },
        { value: 'woning', label: 'Woningbouwcorporatie' },
        { value: 'bib', label: 'Bibliotheek' },
        { value: 'religie', label: 'Kerk of moskee' },
        { value: 'zorg', label: 'Gezondheidscentrum' },
        { value: 'mkb', label: 'Lokaal MKB' },
        { value: 'bewoners', label: 'Bewonersvereniging' },
        { value: 'gemeente', label: 'Gemeente (afdeling)' },
        { value: 'school', label: 'School of onderwijs' },
        { value: 'other', label: 'Anders', freeText: 'Namelijk…' },
      ]},
    en: { title: 'What type of organisation do you represent?',
      help: 'Your organisation type will be visible in the overview, not your name.',
      columns: 2,
      options: [
        { value: 'buurthuis', label: 'Community centre' },
        { value: 'cultureel', label: 'Cultural incubator' },
        { value: 'azc', label: 'Asylum centre (AZC/COA)' },
        { value: 'welzijn', label: 'Welfare organisation' },
        { value: 'woning', label: 'Housing association' },
        { value: 'bib', label: 'Library' },
        { value: 'religie', label: 'Church or mosque' },
        { value: 'zorg', label: 'Health centre' },
        { value: 'mkb', label: 'Local SME' },
        { value: 'bewoners', label: 'Residents\u2019 association' },
        { value: 'gemeente', label: 'Municipality (department)' },
        { value: 'school', label: 'School or education' },
        { value: 'other', label: 'Other', freeText: 'Namely…' },
      ]},
  },
  {
    id: 'orgReach', section: 2, kind: 'single', required: true,
    deps: (a) => a.behalfOf === 'org',
    nl: { title: 'Hoeveel mensen bereikt jouw organisatie actief per maand?',
      help: 'Een grove schatting is voldoende. Dit helpt ons bij subsidieaanvragen.',
      options: [
        { value: '<50', label: 'Minder dan 50' },
        { value: '50-200', label: '50 tot 200' },
        { value: '200-500', label: '200 tot 500' },
        { value: '500+', label: 'Meer dan 500' },
        { value: 'dk', label: 'Weet ik niet' },
      ]},
    en: { title: 'How many people does your organisation actively reach per month?',
      help: 'A rough estimate is enough. This helps us in grant applications.',
      options: [
        { value: '<50', label: 'Fewer than 50' },
        { value: '50-200', label: '50 to 200' },
        { value: '200-500', label: '200 to 500' },
        { value: '500+', label: 'More than 500' },
        { value: 'dk', label: 'I don\u2019t know' },
      ]},
  },
  {
    id: 'orgAudience', section: 2, kind: 'multi', required: true,
    deps: (a) => a.behalfOf === 'org',
    nl: { title: 'Welke doelgroepen bereikt jouw organisatie?',
      help: 'Meerdere antwoorden mogelijk. Geen uitputtende lijst nodig.',
      options: [
        { value: 'newcomers', label: 'Nieuwkomers en statushouders' },
        { value: 'diverse', label: 'Diverse culturele achtergrond' },
        { value: 'elderly', label: 'Ouderen' },
        { value: 'youth', label: 'Jongeren en kinderen' },
        { value: 'language', label: 'Beperkte kennis van het Nederlands' },
        { value: 'mixed', label: 'Gemengd publiek' },
        { value: 'other', label: 'Anders', freeText: 'Namelijk…' },
      ]},
    en: { title: 'Which target groups does your organisation reach?',
      help: 'Multiple answers possible. No exhaustive list needed.',
      options: [
        { value: 'newcomers', label: 'Newcomers and status holders' },
        { value: 'diverse', label: 'Diverse cultural backgrounds' },
        { value: 'elderly', label: 'Older adults' },
        { value: 'youth', label: 'Young people and children' },
        { value: 'language', label: 'Limited Dutch proficiency' },
        { value: 'mixed', label: 'Mixed general public' },
        { value: 'other', label: 'Other', freeText: 'Namely…' },
      ]},
  },
  {
    id: 'orgPast', section: 2, kind: 'single-text', required: false,
    deps: (a) => a.behalfOf === 'org',
    nl: { title: 'Heeft jouw organisatie eerder meegedaan aan een wijkinitiatief?',
      help: 'Geen vereiste. Het laat zien dat jouw organisatie al geworteld is.',
      options: [
        { value: 'yes', label: 'Ja', freeText: 'Welk initiatief en wanneer?' },
        { value: 'no', label: 'Nee' },
      ]},
    en: { title: 'Has your organisation taken part in a neighbourhood initiative before?',
      help: 'Not required. Shows your organisation is rooted in the area.',
      options: [
        { value: 'yes', label: 'Yes', freeText: 'Which initiative and when?' },
        { value: 'no', label: 'No' },
      ]},
  },

  // ---- SECTION 3 ----
  {
    id: 'contributions', section: 3, kind: 'multi-cards', required: true,
    nl: { title: 'Hoe kun jij bijdragen?',
      help: 'Meerdere antwoorden mogelijk. Per keuze stellen we een korte vervolgvraag.',
      options: [
        { value: 'A', label: 'Lokale ambassadeur', sub: 'Ik draag het concept uit in de wijk' },
        { value: 'B', label: 'Opbouw en afbouw', sub: 'Ik help bij bouwen en opruimen' },
        { value: 'C', label: 'Digitale promotie', sub: 'Ik deel via social media of website' },
        { value: 'D', label: 'Fysieke promotie', sub: 'Flyers of posters in de wijk' },
        { value: 'E', label: 'Locatie', sub: 'Ik weet of heb een mooie plek' },
        { value: 'F', label: 'Financiële bijdrage', sub: 'Vanaf €100 per editie' },
        { value: 'G', label: 'Fysieke sponsoring', sub: 'Eten, drinken, aankleding' },
        { value: 'H', label: 'Iets anders', sub: 'Verras ons' },
      ]},
    en: { title: 'How can you contribute?',
      help: 'Multiple answers possible. We\u2019ll ask a short follow-up per choice.',
      options: [
        { value: 'A', label: 'Local ambassador', sub: 'I promote the concept locally' },
        { value: 'B', label: 'Set up & pack down', sub: 'I help build and clear the event' },
        { value: 'C', label: 'Digital promotion', sub: 'I share via social / website' },
        { value: 'D', label: 'Physical promotion', sub: 'Flyers or posters' },
        { value: 'E', label: 'Venue', sub: 'I know or can offer a location' },
        { value: 'F', label: 'Financial contribution', sub: 'From €100 per screening' },
        { value: 'G', label: 'Physical sponsorship', sub: 'Food, drinks, decoration' },
        { value: 'H', label: 'Something else', sub: 'Surprise us' },
      ]},
  },

  // ---- SECTION 4: follow-ups, shown only per selection ----
  {
    id: 'f_ambassador', section: 4, kind: 'single', required: false,
    deps: (a) => (a.contributions || []).includes('A'),
    nl: { title: 'Lokale ambassadeur',
      help: 'Als ambassadeur ben jij het gezicht in de wijk. Beperkte tijdsinzet, zichtbare betrokkenheid.',
      options: [
        { value: 'self', label: 'Ik doe het zelf' },
        { value: 'refer', label: 'Ik draag iemand anders voor' },
        { value: 'info', label: 'Ik wil eerst meer informatie' },
      ]},
    en: { title: 'Local ambassador',
      help: 'As ambassador you\u2019re the face in the neighbourhood. Limited time, visible commitment.',
      options: [
        { value: 'self', label: 'I do it myself' },
        { value: 'refer', label: 'I refer someone else' },
        { value: 'info', label: 'I\u2019d like more info first' },
      ]},
  },
  {
    id: 'f_buildcrew', section: 4, kind: 'single', required: false,
    deps: (a) => (a.contributions || []).includes('B'),
    nl: { title: 'Opbouw en afbouw',
      help: '~1,5 uur vooraf, ~1 uur na. 2 mensen is minimum; 4 is ideaal.',
      options: [
        { value: '1', label: '1 persoon (ikzelf)' },
        { value: '2', label: '2 personen (minimum)' },
        { value: '3', label: '3 personen' },
        { value: '4+', label: '4 of meer (ideaal)' },
      ]},
    en: { title: 'Set up and pack down',
      help: '~1.5h before, ~1h after. 2 people minimum, 4 ideal.',
      options: [
        { value: '1', label: '1 person (myself)' },
        { value: '2', label: '2 people (minimum)' },
        { value: '3', label: '3 people' },
        { value: '4+', label: '4 or more (ideal)' },
      ]},
  },
  {
    id: 'f_digital', section: 4, kind: 'multi', required: false,
    deps: (a) => (a.contributions || []).includes('C'),
    nl: { title: 'Digitale promotie — welke kanalen?',
      help: 'Wij leveren kant-en-klare content. Jij hoeft alleen te delen.',
      options: [
        { value: 'ig', label: 'Instagram' }, { value: 'fb', label: 'Facebook' },
        { value: 'tt', label: 'TikTok' }, { value: 'nl', label: 'Website / nieuwsbrief' },
        { value: 'wa', label: 'WhatsApp-groepen in de wijk' }, { value: 'li', label: 'LinkedIn' },
        { value: 'other', label: 'Anders', freeText: 'Namelijk…' },
      ]},
    en: { title: 'Digital promotion — which channels?',
      help: 'We provide ready-to-use content. You just share.',
      options: [
        { value: 'ig', label: 'Instagram' }, { value: 'fb', label: 'Facebook' },
        { value: 'tt', label: 'TikTok' }, { value: 'nl', label: 'Website / newsletter' },
        { value: 'wa', label: 'Neighbourhood WhatsApp groups' }, { value: 'li', label: 'LinkedIn' },
        { value: 'other', label: 'Other', freeText: 'Namely…' },
      ]},
  },
  {
    id: 'f_physical', section: 4, kind: 'multi', required: false,
    deps: (a) => (a.contributions || []).includes('D'),
    nl: { title: 'Fysieke promotie',
      help: 'Flyers op de juiste plek maken verschil. Wij leveren het ontwerp.',
      options: [
        { value: 'print', label: 'Ik kan drukwerk kostenloos regelen' },
        { value: 'distribute', label: 'Ik verspreid op ~25 vaste plekken' },
        { value: 'flyer', label: 'Ik ga flyeren in de wijk' },
        { value: 'other', label: 'Andere vorm', freeText: 'Namelijk…' },
      ]},
    en: { title: 'Physical promotion',
      help: 'Flyers in the right spots matter. We provide the design.',
      options: [
        { value: 'print', label: 'I can arrange printing for free' },
        { value: 'distribute', label: 'I distribute at ~25 fixed spots' },
        { value: 'flyer', label: 'I hand out flyers' },
        { value: 'other', label: 'Another form', freeText: 'Namely…' },
      ]},
  },
  {
    id: 'f_venue', section: 4, kind: 'single', required: false,
    deps: (a) => (a.contributions || []).includes('E'),
    nl: { title: 'Locatie',
      help: 'Een ideale plek: groen, stroom binnen 50m, ruimte voor 50+ bezoekers.',
      options: [
        { value: 'suggest', label: 'Ik heb een locatiesuggestie' },
        { value: 'offer', label: 'Ik kan zelf een locatie aanbieden' },
      ]},
    en: { title: 'Venue',
      help: 'Ideal: green space, power within 50m, room for 50+ visitors.',
      options: [
        { value: 'suggest', label: 'I have a venue suggestion' },
        { value: 'offer', label: 'I can offer a venue myself' },
      ]},
  },
  {
    id: 'f_financial', section: 4, kind: 'euro', required: false,
    deps: (a) => (a.contributions || []).includes('F'),
    nl: { title: 'Financiële bijdrage',
      help: 'Kosten per editie liggen tussen €3.000–€3.500. Minimum €100 per editie.',
      min: 100, suggest: [100, 250, 500, 1000, 2500] },
    en: { title: 'Financial contribution',
      help: 'Cost per screening €3,000–€3,500. Minimum €100.',
      min: 100, suggest: [100, 250, 500, 1000, 2500] },
  },
  {
    id: 'f_sponsor', section: 4, kind: 'long', required: false,
    deps: (a) => (a.contributions || []).includes('G'),
    nl: { title: 'Fysieke sponsoring',
      help: 'Bijv. 2 kratten limonade, 100 stroopwafels, lichtkettingen. Vermeld geschatte waarde in €.',
      placeholder: 'Wat doneer je, per editie of eenmalig, en geschatte waarde…' },
    en: { title: 'Physical sponsorship',
      help: 'E.g. 2 crates of lemonade, 100 cookies, string lights. Include estimated value.',
      placeholder: 'What, per screening or one-off, estimated value…' },
  },
  {
    id: 'f_other', section: 4, kind: 'long', required: false,
    deps: (a) => (a.contributions || []).includes('H'),
    nl: { title: 'Een andere bijdrage',
      help: 'Verras ons. Niet alles past in een vakje.',
      placeholder: 'Beschrijf je bijdrage en geschatte waarde…' },
    en: { title: 'Another form of contribution',
      help: 'Surprise us. Not everything fits in a box.',
      placeholder: 'Describe your contribution and estimated value…' },
  },

  // ---- SECTION 5 ----
  {
    id: 'permission', section: 5, kind: 'single', required: true,
    nl: { title: 'Mogen we jouw naam en logo gebruiken?',
      help: 'Zichtbare steun maakt subsidieaanvragen aantoonbaar sterker.',
      options: [
        { value: 'both', label: 'Ja, naam én logo' },
        { value: 'name', label: 'Ja, alleen naam' },
        { value: 'no', label: 'Nee' },
      ]},
    en: { title: 'May we use your name and logo?',
      help: 'Visible support makes grant applications measurably stronger.',
      options: [
        { value: 'both', label: 'Yes, name and logo' },
        { value: 'name', label: 'Yes, name only' },
        { value: 'no', label: 'No' },
      ]},
  },

  // ---- SECTION 6 ----
  {
    id: 'motivation', section: 6, kind: 'long', required: true, minWords: 100,
    nl: { title: 'Waarom steun jij Nelson\u2019s Film?',
      help: 'Minimaal 100 woorden. Schrijf vanuit jezelf, in gewone taal. Dit is een van de zwaarst wegende onderdelen.',
      placeholder: 'Vertel in eigen woorden waarom dit initiatief belangrijk is, vanuit jouw perspectief op de wijk…' },
    en: { title: 'Why do you support Nelson\u2019s Film?',
      help: 'At least 100 words. Write from the heart, plain language. One of the most important parts.',
      placeholder: 'Tell us in your own words why this initiative matters, from your perspective on the neighbourhood…' },
  },
  {
    id: 'need', section: 6, kind: 'single-text', required: true,
    nl: { title: 'Is er behoefte aan een verbindend wijkprogramma?',
      help: 'Vertrouw op wat jij ziet en ervaart. Geen beleidsanalyse nodig.',
      options: [
        { value: 'yes', label: 'Ja', freeText: 'Wat zie, hoor of ervaar je? (min. 50 woorden)' },
        { value: 'no', label: 'Nee' },
        { value: 'dk', label: 'Ik weet het niet' },
      ]},
    en: { title: 'Is there a need for a connecting neighbourhood programme?',
      help: 'Trust what you see and experience. No policy analysis required.',
      options: [
        { value: 'yes', label: 'Yes', freeText: 'What do you see, hear or experience? (min. 50 words)' },
        { value: 'no', label: 'No' },
        { value: 'dk', label: 'Not sure' },
      ]},
  },
  {
    id: 'hardToReach', section: 6, kind: 'multi', required: false,
    deps: (a) => a.need === 'yes',
    nl: { title: 'Welke groepen worden moeilijk bereikt door bestaande initiatieven?',
      help: 'Jouw kennis van de wijk is hier onmisbaar.',
      options: [
        { value: 'newcomers', label: 'Nieuwkomers en statushouders' },
        { value: 'diverse', label: 'Diverse culturele achtergrond' },
        { value: 'isolated', label: 'Sociaal geïsoleerde ouderen' },
        { value: 'youth', label: 'Jongeren zonder ontmoetingsplek' },
        { value: 'language', label: 'Mensen die NL nog niet beheersen' },
        { value: 'dk', label: 'Weet ik niet' },
        { value: 'other', label: 'Anders', freeText: 'Namelijk…' },
      ]},
    en: { title: 'Which groups are hard to reach by existing initiatives?',
      help: 'Your neighbourhood knowledge is invaluable here.',
      options: [
        { value: 'newcomers', label: 'Newcomers and status holders' },
        { value: 'diverse', label: 'Diverse cultural backgrounds' },
        { value: 'isolated', label: 'Socially isolated older adults' },
        { value: 'youth', label: 'Young people without a meeting place' },
        { value: 'language', label: 'Limited Dutch proficiency' },
        { value: 'dk', label: 'I don\u2019t know' },
        { value: 'other', label: 'Other', freeText: 'Namely…' },
      ]},
  },
  {
    id: 'languages', section: 6, kind: 'multi', required: false,
    deps: (a) => a.need === 'yes',
    nl: { title: 'Welke talen worden naast Nederlands veel gesproken?',
      help: 'Meertaligheid is de kern van Nelson\u2019s Film. Een indicatie is genoeg.',
      columns: 2,
      options: [
        { value: 'ar', label: 'Arabisch' }, { value: 'tr', label: 'Turks' },
        { value: 'pl', label: 'Pools' }, { value: 'ti', label: 'Tigrinya' },
        { value: 'fa', label: 'Dari / Farsi' }, { value: 'so', label: 'Somalisch' },
        { value: 'dk', label: 'Weet ik niet' },
        { value: 'other', label: 'Andere taal', freeText: 'Namelijk…' },
      ]},
    en: { title: 'Which languages are widely spoken besides Dutch?',
      help: 'Multilingualism is at the core of Nelson\u2019s Film. An estimate is enough.',
      columns: 2,
      options: [
        { value: 'ar', label: 'Arabic' }, { value: 'tr', label: 'Turkish' },
        { value: 'pl', label: 'Polish' }, { value: 'ti', label: 'Tigrinya' },
        { value: 'fa', label: 'Dari / Farsi' }, { value: 'so', label: 'Somali' },
        { value: 'dk', label: 'Not sure' },
        { value: 'other', label: 'Another language', freeText: 'Namely…' },
      ]},
  },
  {
    id: 'reach', section: 6, kind: 'single', required: true,
    nl: { title: 'Hoeveel unieke bewoners verwacht je te bereiken via jouw netwerk?',
      help: 'Per editie. Wij rekenen je niet af op het getal.',
      options: [
        { value: '<25', label: 'Minder dan 25' },
        { value: '25-75', label: '25 tot 75' },
        { value: '75-150', label: '75 tot 150' },
        { value: '150+', label: 'Meer dan 150' },
        { value: 'dk', label: 'Weet ik niet' },
      ]},
    en: { title: 'How many unique residents do you expect to reach through your network?',
      help: 'Per screening. We won\u2019t hold you to this number.',
      options: [
        { value: '<25', label: 'Fewer than 25' },
        { value: '25-75', label: '25 to 75' },
        { value: '75-150', label: '75 to 150' },
        { value: '150+', label: 'More than 150' },
        { value: 'dk', label: 'Not sure' },
      ]},
  },
  {
    id: 'similar', section: 6, kind: 'long', required: false,
    nl: { title: 'Bestaande vergelijkbare initiatieven in de wijk?',
      help: 'Vult Nelson\u2019s Film iets aan, of is het dubbel? Beide antwoorden zijn bruikbaar.',
      placeholder: 'Bijv. "er is wel een buurtfeest, maar nooit iets meertaligs"…' },
    en: { title: 'Any comparable initiatives in your neighbourhood?',
      help: 'Does Nelson\u2019s Film complement or duplicate? Both answers are useful.',
      placeholder: 'E.g. "there\u2019s a street party, but nothing multilingual"…' },
  },

  // ---- SECTION 7 ----
  {
    id: 'preshow', section: 7, kind: 'single-text', required: false,
    nl: { title: 'Suggestie voor het voorprogramma?',
      help: 'Voor zonsondergang bieden we tot 2 uur programmering. Een lokale act versterkt het buurtsgevoel.',
      options: [
        { value: 'yes', label: 'Ja, ik heb een suggestie', freeText: 'Omschrijving en contactgegevens' },
        { value: 'no', label: 'Nee, silent disco is prima' },
      ]},
    en: { title: 'Pre-programme suggestion?',
      help: 'Before sunset we run up to 2h of programming. A local act strengthens the community vibe.',
      options: [
        { value: 'yes', label: 'Yes, I have a suggestion', freeText: 'Description and contact details' },
        { value: 'no', label: 'No, silent disco is fine' },
      ]},
  },
  {
    id: 'remarks', section: 7, kind: 'long', required: false,
    nl: { title: 'Aanvullende opmerkingen of ideeën?',
      help: 'Iets dat je kwijt wilt en nergens paste? Hier is de plek.',
      placeholder: 'Optioneel…' },
    en: { title: 'Additional comments or ideas?',
      help: 'Anything that didn\u2019t fit elsewhere? Here\u2019s the place.',
      placeholder: 'Optional…' },
  },
];

// Validator helper
window.validateQuestion = function(q, answers, lang) {
  if (!q.required) return { ok: true };
  const v = answers[q.id];
  if (q.kind === 'text-group') {
    const fields = q[lang].fields;
    const missing = fields.filter(f => !f.optional && !((v || {})[f.key] || '').trim());
    if (missing.length) return { ok: false, msg: lang === 'nl' ? 'Vul de verplichte velden in' : 'Please fill the required fields' };
    return { ok: true };
  }
  if (q.kind === 'multi' || q.kind === 'multi-cards') {
    if (!v || !v.length) return { ok: false, msg: lang === 'nl' ? 'Kies minimaal één optie' : 'Pick at least one' };
    return { ok: true };
  }
  if (q.kind === 'long') {
    const text = (v || '').trim();
    if (!text) return { ok: false, msg: lang === 'nl' ? 'Dit veld is verplicht' : 'This field is required' };
    if (q.minWords) {
      const words = text.split(/\s+/).filter(Boolean).length;
      if (words < q.minWords) return { ok: false, msg: lang === 'nl' ? `Minimaal ${q.minWords} woorden (nu ${words})` : `At least ${q.minWords} words (now ${words})` };
    }
    return { ok: true };
  }
  if (q.kind === 'euro') {
    const n = Number(v);
    if (!n || n < (q.min || 0)) return { ok: false, msg: lang === 'nl' ? `Minimaal €${q.min}` : `Minimum €${q.min}` };
    return { ok: true };
  }
  if (!v) return { ok: false, msg: lang === 'nl' ? 'Kies een optie' : 'Please choose an option' };
  return { ok: true };
};
