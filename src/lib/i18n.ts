export type Lang = 'es' | 'en' | 'fr' | 'eu';

export const DEFAULT_LANG: Lang = 'es';

export const LANGUAGES: { code: Lang; label: string }[] = [
    { code: 'es', label: 'Español' },
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
    { code: 'eu', label: 'Euskara' },
];

type Dict = Record<string, string | Dict>;

const DICT: Record<Lang, Dict> = {
    es: {
        header: { title: 'TORNEO DE MUS' },
        importLabel: 'Importar',
        addPair: { title: 'Añadir pareja', placeholder1: 'Jugador 1', placeholder2: 'Jugador 2', addButton: 'Añadir pareja' },
        pairs: { title: 'Parejas', empty: 'Aún no hay parejas inscritas.', clear: 'Vaciar', remove: 'Quitar', error: { emptyNames: 'Debes introducir los dos nombres de la pareja.', duplicate: 'Esa pareja ya está registrada.' } },
        fees: { title: 'Cuotas y premios', entryFee: 'Cuota por pareja', auto: 'Auto', manual: 'Manual', autoSplit: 'Reparto automático', currency: 'Moneda', pool: 'Bote total' },
        format: {
            title: 'Formato de partida',
            customPlaceholder: 'Ejemplo: 11',
            invalidCustom: 'Debe ser un número impar mayor que 0.',
            options: { '3': 'Al mejor de 3', '5': 'Al mejor de 5', '7': 'Al mejor de 7', '9': 'Al mejor de 9', custom: 'Personalizado' },
        },
        entropy: {
            title: '🎲 Nivel de aleatoriedad',
            hint: 'Mueve el ratón por la pantalla para un sorteo más seguro',
            labels: {
                max: 'Máxima - ¡Perfecto!',
                veryHigh: 'Muy alta',
                high: 'Alta',
                medium: 'Media',
                low: 'Baja',
                none: 'Sin aleatoriedad',
            },
            hintKeyboard: 'Mueve el ratón y pulsa teclas para un sorteo más seguro.',
        },
        match: {
            error: {
                nan: 'Debes introducir dos números.',
                invalidScore: 'Marcador inválido para mejor de {bestOf}. Debe ganar a {winsNeeded}.',
                registerFail: 'No se pudo registrar el resultado.',
            },
            prelimLabel: 'Previa',
            roundLabel: 'Ronda {round}',
            pending: 'Pendiente de clasificados...',
            vs: 'VS',
            editAria: 'Editar resultado',
            confirmEdit: 'Editar este resultado borrará los resultados dependientes. ¿Continuar?',
            boBadge: 'BO{bestOf}',
            placeholderScore: '0',
            byeInfo: 'Pasa automáticamente a la siguiente ronda.',
        },
        podium: {
            title: 'Torneo finalizado',
            pool: 'Bote total: {pool} {currency}',
            labels: { fourth: '4º puesto', third: '3º puesto', thirdShared: '3º/4º compartido', second: '2º puesto', first: 'Campeón' },
        },
        prizes: { thirdPlaceShared: '3º puesto compartido' },
        
        button: { confirm: 'Confirmar' },
        ui: { language: 'Idioma' },
        generate: { confirmReplace: 'Reemplazar parejas existentes con 80 parejas aleatorias?' },
        left: { pairEntryHeader: 'Añadir parejas', prizesLabel: 'Premios', bestOfLabel: 'Formato', createButton: 'Crear torneo' },
        setup: { title: 'Configura tu torneo', description: 'Añade parejas en el panel izquierdo, define premios y formato, y después crea el cuadro. El emparejamiento se realiza con una semilla basada en entropía de tus interacciones.' },
        create: { label: 'Crear torneo', needPairs: 'Necesitas al menos 2 parejas para crear el torneo.' },
        prelim: { card: { prelimRound: 'Ronda previa', target: 'Cuadro objetivo', byes: 'Pasan directas', playPrelim: 'Juegan previa', matchesCount: '{count} partidas', pairsCount: '{count} parejas' } },
        
        phase: { prelimTitle: 'Fase previa ({count} partidas)' },
        bracket: { title: 'Cuadro principal' },
        round: { header: 'Ronda {n}' },
        export: {
            title: 'Exportar',
            exportButton: 'Exportar torneo',
            reset: 'Reiniciar torneo',
            option: { json: 'JSON firmado', csv: 'CSV firmado', xlsx: 'XLSX' },
            sheet: { field: 'Campo', value: 'Valor' },
            xlsx: { matches: 'Partidas', meta: 'Metadatos', prizes: 'Premios' },
            csvHeaders: { phase: 'Fase', round: 'Ronda', match: 'Partida', pair1: 'Pareja 1', pair2: 'Pareja 2', victories1: 'Victorias P1', victories2: 'Victorias P2', winner: 'Ganador' },
            prize: { first: '1er premio', second: '2º premio', third: '3er premio', fourth: '4º premio' },
        },
        error: { importFile: 'Error al importar archivo.', invalidJSON: 'Archivo inválido — no es JSON válido' },
        import: { missingSheets: 'Faltan hojas obligatorias: "Metadatos" o "Partidas".', invalidSignature: { xlsx: 'Firma inválida. El archivo XLSX fue alterado.', csv: 'Firma inválida. El archivo CSV fue alterado.' } },
        bye: 'BYE',
        confirmReset: '¿Reiniciar el torneo? Se perderán todos los resultados.',
        seed: 'Seed',
        bestOfBadge: '🔒 Al mejor de {bestOf}',
    },
    en: {
        header: { title: 'MUS TOURNAMENT' },
        importLabel: 'Import',
        addPair: { title: 'Add pair', placeholder1: 'Player 1', placeholder2: 'Player 2', addButton: 'Add pair' },
        pairs: { title: 'Pairs', empty: 'No pairs registered yet.', clear: 'Clear', remove: 'Remove', error: { emptyNames: 'You must enter both players names.', duplicate: 'That pair is already registered.' } },
        fees: { title: 'Fees & Prizes', entryFee: 'Entry fee per pair', auto: 'Auto', manual: 'Manual', autoSplit: 'Auto split', currency: 'Currency', pool: 'Total pool' },
        format: {
            title: 'Match format',
            customPlaceholder: 'Example: 11',
            invalidCustom: 'Must be an odd integer greater than 0.',
            options: { '3': 'Best of 3', '5': 'Best of 5', '7': 'Best of 7', '9': 'Best of 9', custom: 'Custom' },
        },
        entropy: {
            title: '🎲 Entropy level',
            hint: 'Move the mouse to increase randomness',
            labels: { max: 'Maximum — Perfect!', veryHigh: 'Very high', high: 'High', medium: 'Medium', low: 'Low', none: 'No entropy' },
            hintKeyboard: 'Move the mouse and press keys for a more secure draw.',
        },
        match: {
            error: { nan: 'You must enter two numbers.', invalidScore: 'Invalid score for best of {bestOf}. Winner must reach {winsNeeded}.', registerFail: 'Could not record the result.' },
            prelimLabel: 'Preliminary',
            roundLabel: 'Round {round}',
            pending: 'Awaiting qualifiers...',
            vs: 'VS',
            editAria: 'Edit result',
            confirmEdit: 'Editing this result will erase dependent results. Continue?',
            boBadge: 'BO{bestOf}',
            placeholderScore: '0',
            byeInfo: 'Automatically advances to the next round.',
        },
        podium: { title: 'Tournament finished', pool: 'Total pool: {pool} {currency}', labels: { fourth: '4th place', third: '3rd place', thirdShared: '3rd/4th shared', second: '2nd place', first: 'Champion' } },
        prizes: { thirdPlaceShared: '3rd place shared' },
        
        button: { confirm: 'Confirm' },
        ui: { language: 'Language' },
        generate: { confirmReplace: 'Replace existing pairs with 80 random pairs?' },
        left: { pairEntryHeader: 'Add pairs', prizesLabel: 'Prizes', bestOfLabel: 'Format', createButton: 'Create tournament' },
        setup: { title: 'Set up your tournament', description: 'Add pairs in the left panel, set prizes and format, then create the bracket. Pairings are generated from a seed derived from your interaction entropy.' },
        create: { label: 'Create tournament', needPairs: 'You need at least 2 pairs to create the tournament.' },
        prelim: { card: { prelimRound: 'Preliminary round', target: 'Target bracket', byes: 'Byes', playPrelim: 'Play prelim', matchesCount: '{count} matches', pairsCount: '{count} pairs' } },
        
        phase: { prelimTitle: 'Preliminary phase ({count} matches)' },
        bracket: { title: 'Main bracket' },
        round: { header: 'Round {n}' },
        export: {
            title: 'Export',
            exportButton: 'Export tournament',
            reset: 'Reset tournament',
            option: { json: 'Signed JSON', csv: 'Signed CSV', xlsx: 'XLSX' },
            sheet: { field: 'Field', value: 'Value' },
            xlsx: { matches: 'Matches', meta: 'Metadata', prizes: 'Prizes' },
            csvHeaders: { phase: 'Phase', round: 'Round', match: 'Match', pair1: 'Pair 1', pair2: 'Pair 2', victories1: 'Wins P1', victories2: 'Wins P2', winner: 'Winner' },
            prize: { first: '1st prize', second: '2nd prize', third: '3rd prize', fourth: '4th prize' },
        },
        error: { importFile: 'Error importing file.', invalidJSON: 'Invalid file — not valid JSON' },
        import: { missingSheets: 'Missing required sheets: "Metadatos" or "Partidas".', invalidSignature: { xlsx: 'Invalid signature. The XLSX file was altered.', csv: 'Invalid signature. The CSV file was altered.' } },
        bye: 'BYE',
        confirmReset: 'Reset the tournament? All results will be lost.',
        seed: 'Seed',
        bestOfBadge: '🔒 Best of {bestOf}',
    },
    fr: {
        header: { title: 'TOURNOI DE MUS' },
        importLabel: 'Importer',
        addPair: { title: 'Ajouter paire', placeholder1: 'Joueur 1', placeholder2: 'Joueur 2', addButton: 'Ajouter paire' },
        pairs: { title: 'Paires', empty: 'Aucune paire inscrite.', clear: 'Vider', remove: 'Supprimer', error: { emptyNames: 'Vous devez saisir les deux noms de la paire.', duplicate: 'Cette paire est déjà enregistrée.' } },
        fees: { title: 'Frais & Prix', entryFee: 'Frais par paire', auto: 'Auto', manual: 'Manuel', autoSplit: 'Répartition auto', currency: 'Devise', pool: 'Cagnotte' },
        format: { title: 'Format de match', customPlaceholder: 'Ex: 11', invalidCustom: 'Doit être un entier impair > 0.', options: { '3': 'Meilleur de 3', '5': 'Meilleur de 5', '7': 'Meilleur de 7', '9': 'Meilleur de 9', custom: 'Personnalisé' } },
        entropy: { title: '🎲 Niveau d’entropie', hint: 'Déplacez la souris pour augmenter l’aléa', labels: { max: 'Maximale — Parfait !', veryHigh: 'Très élevée', high: 'Élevée', medium: 'Moyenne', low: 'Faible', none: 'Sans aléa' }, hintKeyboard: 'Déplacez la souris et appuyez sur des touches pour un tirage plus sûr.' },
        match: { error: { nan: 'Vous devez entrer deux nombres.', invalidScore: 'Score invalide pour meilleur de {bestOf}. Le gagnant doit atteindre {winsNeeded}.', registerFail: 'Impossible d’enregistrer le résultat.' }, prelimLabel: 'Préliminaire', roundLabel: 'Tour {round}', pending: 'En attente des qualifiés...', vs: 'VS', editAria: 'Modifier le résultat', confirmEdit: 'Modifier ce résultat effacera les résultats dépendants. Continuer ?', boBadge: 'BO{bestOf}', placeholderScore: '0', byeInfo: 'Passe automatiquement au tour suivant.' },
        podium: { title: 'Tournoi terminé', pool: 'Cagnotte totale : {pool} {currency}', labels: { fourth: '4ᵉ place', third: '3ᵉ place', thirdShared: '3ᵉ/4ᵉ partagé', second: '2ᵉ place', first: 'Champion' } },
        prizes: { thirdPlaceShared: '3ᵉ place partagé' },
        
        button: { confirm: 'Confirmer' },
        ui: { language: 'Langue' },
        generate: { confirmReplace: 'Remplacer les paires existantes par 80 paires aléatoires ?' },
        left: { pairEntryHeader: 'Ajouter des paires', prizesLabel: 'Prix', bestOfLabel: 'Format', createButton: 'Créer le tournoi' },
        setup: { title: 'Configurez votre tournoi', description: 'Ajoutez des paires dans le panneau de gauche, définissez les prix et le format, puis créez le tableau. Les appariements sont générés à partir d’une graine dérivée de l’entropie de vos interactions.' },
        create: { label: 'Créer le tournoi', needPairs: 'Vous devez avoir au moins 2 paires pour créer le tournoi.' },
        prelim: { card: { prelimRound: 'Phase préliminaire', target: 'Tableau cible', byes: 'Qualifiés directs', playPrelim: 'Jouent la préliminaire', matchesCount: '{count} matchs', pairsCount: '{count} paires' } },
        
        phase: { prelimTitle: 'Phase préliminaire ({count} matchs)' },
        bracket: { title: 'Tableau principal' },
        round: { header: 'Tour {n}' },
        export: { title: 'Exporter', exportButton: 'Exporter le tournoi', reset: 'Réinitialiser le tournoi', option: { json: 'JSON signé', csv: 'CSV signé', xlsx: 'XLSX' }, sheet: { field: 'Champ', value: 'Valeur' }, xlsx: { matches: 'Matchs', meta: 'Métadonnées', prizes: 'Prix' }, csvHeaders: { phase: 'Phase', round: 'Tour', match: 'Match', pair1: 'Paire 1', pair2: 'Paire 2', victories1: 'Victoires P1', victories2: 'Victoires P2', winner: 'Vainqueur' }, prize: { first: '1er prix', second: '2e prix', third: '3e prix', fourth: '4e prix' } },
        error: { importFile: "Erreur lors de l'importation du fichier.", invalidJSON: 'Fichier invalide — JSON non valide' },
        import: { missingSheets: 'Feuilles requises manquantes : "Metadatos" ou "Partidas".', invalidSignature: { xlsx: 'Signature invalide. Le fichier XLSX a été modifié.', csv: 'Signature invalide. Le fichier CSV a été modifié.' } },
        bye: 'BYE',
        confirmReset: 'Réinitialiser le tournoi ? Tous les résultats seront perdus.',
        seed: 'Seed',
        bestOfBadge: '🔒 Meilleur de {bestOf}',
    },
    eu: {
        header: { title: 'MUS TXAPELKETA' },
        importLabel: 'Inportatu',
        addPair: { title: 'Bikotea gehitu', placeholder1: 'Jokalari 1', placeholder2: 'Jokalari 2', addButton: 'Bikotea gehitu' },
        pairs: { title: 'Bikoteak', empty: 'Oraindik ez da bikoterik erregistratu.', clear: 'Garbitu', remove: 'Kendu', error: { emptyNames: 'Bi izenak sartu behar dituzu.', duplicate: 'Bikote hori jadanik erregistratuta dago.' } },
        fees: { title: 'Kuotak eta sariak', entryFee: 'Bikote bakoitzeko kuota', auto: 'Auto', manual: 'Eskuzkoa', autoSplit: 'Banaketa automatikoa', currency: 'Moneta', pool: 'Guztira' },
        format: {
            title: 'Partidaren formatua',
            customPlaceholder: 'Adibidez: 11',
            invalidCustom: '0 baino handiagoa den, bikoitza ez den zenbaki bat izan behar da.',
            options: { '3': '3 partidako onena', '5': '5 partidako onena', '7': '7 partidako onena', '9': '9 partidako onena', custom: 'Pertsonalizatua' },
        },
        entropy: {
            title: '🎲 Entropia maila',
            hint: 'Ziurtasunezko zozketa handiagoa lortzeko mugitu saguarekin',
            labels: {
                max: 'Gehienez — Perfectua!',
                veryHigh: 'Oso altua',
                high: 'Altua',
                medium: 'Ertaina',
                low: 'Txikia',
                none: 'Entropiarik gabe',
            },
            hintKeyboard: 'Sagua mugitu eta teklak sakatu zozketa seguruago izateko.',
        },
        match: {
            error: {
                nan: 'Bi zenbaki sartu behar dituzu.',
                invalidScore: '{bestOf} onenarako balorazio baliogabea. Irabazleak {winsNeeded} lortu behar ditu.',
                registerFail: 'Ezin izan da emaitza erregistratu.',
            },
            prelimLabel: 'Aurrebaldintza',
            roundLabel: 'Txanda {round}',
            pending: 'Kualifikazioak itxaroten...',
            vs: 'VS',
            editAria: 'Emaitza aldatu',
            confirmEdit: 'Emaitza hau aldatzeak dependentzia emaitzak ezabatuko ditu. Jarraitu?',
            boBadge: 'BO{bestOf}',
            placeholderScore: '0',
            byeInfo: 'Hurrengo txandara zuzen pasatzen da.',
        },
        podium: {
            title: 'Txapelketa amaituta',
            pool: 'Sari kutxa: {pool} {currency}',
            labels: { fourth: '4. postua', third: '3. postua', thirdShared: '3./4. partekatua', second: '2. postua', first: 'Txapelduna' },
        },
        prizes: { thirdPlaceShared: '3. postua partekatuta' },
        
        button: { confirm: 'Onartu' },
        ui: { language: 'Hizkuntza' },
        generate: { confirmReplace: 'Orain dauden bikoteak 80 bikote ausazkinengatik ordezkatu?' },
        
        setup: { title: 'Zure txapelketa konfiguratu', description: 'Ezkerreko panelean bikoteak gehitu, sariak eta formatua ezarri, eta ondoren koadroa sortu. Kuadroa zure interakzioen entropiatik eratorritako hazitik sortzen da.' },
        create: { label: 'Sortu txapelketa', needPairs: 'Gutxienez 2 bikote behar dituzu txapelketa sortzeko.' },
        left: {
            pairEntryHeader: 'Bikoteak gehitu',
            prizesLabel: 'Sariak',
            bestOfLabel: 'Partidaren formatua',
            createButton: 'Sortu txapelketa'
        },
        prelim: { card: { prelimRound: 'Aurrebaldintza', target: 'Helburu koadroa', byes: 'Zuzen pasatzen dira', playPrelim: 'Aurrebaldintzan jokatzen dute', matchesCount: '{count} partida', pairsCount: '{count} bikote' } },
        
        phase: { prelimTitle: 'Aurrebaldintza fasea ({count} partida)' },
        bracket: { title: 'Koadro nagusia' },
        round: { header: 'Txanda {n}' },
        export: {
            title: 'Esportatu',
            exportButton: 'Txapelketa esportatu',
            reset: 'Txapelketa berrezarri',
            option: { json: 'Sinatutako JSON', csv: 'Sinatutako CSV', xlsx: 'XLSX' },
            sheet: { field: 'Eremua', value: 'Balioa' },
            xlsx: { matches: 'Partidak', meta: 'Metadatuak', prizes: 'Sariak' },
            csvHeaders: { phase: 'Fasea', round: 'Txanda', match: 'Partida', pair1: 'Bikotea 1', pair2: 'Bikotea 2', victories1: 'Irabaziak P1', victories2: 'Irabaziak P2', winner: 'Irabazlea' },
            prize: { first: '1. saria', second: '2. saria', third: '3. saria', fourth: '4. saria' },
        },
        error: { importFile: 'Fitxategia inportatzean errorea.', invalidJSON: 'Fitxategia baliogabea — ez da JSON baliogarri' },
        import: { missingSheets: 'Beharrezko orriak falta dira: "Metadatos" edo "Partidas".', invalidSignature: { xlsx: 'Sinadura baliogabea. XLSX fitxategia aldatuta egon da.', csv: 'Sinadura baliogabea. CSV fitxategia aldatuta egon da.' } },
        bye: 'BYE',
        confirmReset: 'Txapelketa berrezarri? Emaitzak galduko dira.',
        seed: 'Hazia',
        bestOfBadge: '🔒 {bestOf} onena',
    },
};

// Additional keys used by `src/components/TournamentApp.tsx`
// Exported list helps reviewers find what was added for Phase 1.
export const I18N_KEYS = [
    'entropy.labels.max',
    'entropy.labels.veryHigh',
    'entropy.labels.high',
    'entropy.labels.medium',
    'entropy.labels.low',
    'entropy.labels.none',
    'entropy.hintKeyboard',

    'match.error.nan',
    'match.error.invalidScore',
    'match.error.registerFail',
    'match.prelimLabel',
    'match.roundLabel',
    'match.pending',
    'match.vs',
    'match.editAria',
    'match.confirmEdit',
    'match.boBadge',
    'match.placeholderScore',
    'match.byeInfo',

    'pairs.error.emptyNames',
    'pairs.error.duplicate',

    'podium.title',
    'podium.pool',
    'podium.labels.fourth',
    'podium.labels.third',
    'podium.labels.thirdShared',
    'podium.labels.second',
    'podium.labels.first',

    'ui.language',
    'prizes.thirdPlaceShared',

    'format.option.3',
    'format.option.5',
    'format.option.7',
    'format.option.9',
    'format.option.custom',

    'button.confirm',

    'setup.title',
    'setup.description',

    'prelim.card.prelimRound',
    'prelim.card.target',
    'prelim.card.byes',
    'prelim.card.playPrelim',
    
    'phase.prelimTitle',
    'bracket.title',
    'round.header',

    'export.option.json',
    'export.option.csv',
    'export.option.xlsx',
    'export.sheet.field',
    'export.sheet.value',
    'export.xlsx.matches',
    'export.xlsx.meta',
    'export.xlsx.prizes',

    'import.missingSheets',
    'import.invalidSignature.xlsx',
    'import.invalidSignature.csv',

    'export.csvHeaders.phase',
    'export.csvHeaders.round',
    'export.csvHeaders.match',
    'export.csvHeaders.pair1',
    'export.csvHeaders.pair2',
    'export.csvHeaders.victories1',
    'export.csvHeaders.victories2',
    'export.csvHeaders.winner',

    'export.prize.first',
    'export.prize.second',
    'export.prize.third',
    'export.prize.fourth',
];

function getNested(dict: Dict | string, path: string[]): string | undefined {
    if (typeof dict === 'string') return dict;
    let cur: any = dict;
    for (const p of path) {
        if (cur == null) return undefined;
        cur = cur[p];
    }
    return typeof cur === 'string' ? cur : undefined;
}

export function t(lang: Lang, key: string, vars?: Record<string, string | number>): string {
    const path = key.split('.');
    const dict = DICT[lang] || DICT[DEFAULT_LANG];
    let str = getNested(dict, path) ?? getNested(DICT[DEFAULT_LANG], path) ?? key;
    if (vars) {
        for (const k of Object.keys(vars)) {
            str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(vars[k]));
        }
    }
    return str;
}

export default DICT;
