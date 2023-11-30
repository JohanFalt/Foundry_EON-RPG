export const eon = {};

eon.ikoner = { 
    fardighet: "systems/eon-rpg/assets/img/icons/archive-register.svg",
    sprak: "systems/eon-rpg/assets/img/icons/archive-register.svg",
    mysterie: "systems/eon-rpg/assets/img/icons/prayer.svg",
    besvarjelse: "systems/eon-rpg/assets/img/icons/spell-book.svg",
    faltstorning: "systems/eon-rpg/assets/img/icons/burning-book.svg",
    slag_chock: "systems/eon-rpg/assets/img/icons/knockout.svg",
    slag_dod: "systems/eon-rpg/assets/img/icons/half-dead.svg",
    slag_initiative: "systems/eon-rpg/assets/img/icons/swords-emblem.svg",
    skada: "systems/eon-rpg/assets/img/icons/arrowed.svg",
    initiative_distance: "systems/eon-rpg/assets/img/icons/bowman.svg",
    initiative_close: "systems/eon-rpg/assets/img/icons/swordman.svg",
    initiative_mystic: "systems/eon-rpg/assets/img/icons/magic-swirl.svg",
    initiative_other: "systems/eon-rpg/assets/img/icons/shrug.svg",
    foremal_hand: "systems/eon-rpg/assets/img/icons/fist.svg",
    foremal_dolk: "systems/eon-rpg/assets/img/icons/plain-dagger.svg",
    foremal_kedjevapen: "systems/eon-rpg/assets/img/icons/flail.svg",
    foremal_klubba: "systems/eon-rpg/assets/img/icons/flanged-mace.svg",
    foremal_spjut: "systems/eon-rpg/assets/img/icons/arrowhead.svg",
    foremal_stav: "systems/eon-rpg/assets/img/icons/bo.svg",
    foremal_svard: "systems/eon-rpg/assets/img/icons/broadsword.svg",
    foremal_yxa: "systems/eon-rpg/assets/img/icons/battle-axe.svg",
    foremal_skold: "systems/eon-rpg/assets/img/icons/shield.svg",
    foremal_rustning: "systems/eon-rpg/assets/img/icons/chest-armor.svg",
    foremal_armborst: "systems/eon-rpg/assets/img/icons/crossbow.svg",
    foremal_bage: "systems/eon-rpg/assets/img/icons/high-shot.svg",
    foremal_kastvapen: "systems/eon-rpg/assets/img/icons/thrown-spear.svg"    
}

eon.slag = {
    grundegenskap: "Grundegenskap",
    fardighet: "Färdighet",
    mysterium: "Mysterium",
    vapen: "Vapen"
}

eon.grundegenskaper = {
    styrka: {
        namn: "Styrka",
        kort: "STY"
    },
    talighet: {
        namn: "Tålighet",
        kort: "TÅL"
    },
    rorlighet: {
        namn: "Rörlighet",
        kort: "RÖR"
    },
    uppfattning: {
        namn: "Uppfattning",
        kort: "UPP"
    },
    vilja: {
        namn: "Vilja",
        kort: "VIL"
    },
    psyke: {
        namn: "Psyke",
        kort: "PSY"
    },
    visdom: {
        namn: "Visdom",
        kort: "VIS"
    },
    utstralning: {
        namn: "Utstålning",
        kort: "UTS"
    }
}

eon.harleddegenskaper = {
    forflyttning: {
        namn: "Förflyttning"
    },
    intryck: {
        namn: "Intryck"
    },
    kroppsbyggnad: {
        namn: "Kroppsbyggnad"
    },
    reaktion: {
        namn: "Reaktion"
    },
    sjalvkontroll: {
        namn: "Självkontroll"
    },
    vaksamhet: {
        namn: "Vaksamhet"
    },
    livskraft: {
        namn: "Livskraft"

    }
}

eon.fardighetgrupper = {
    strid: "Stridsfärdigheter",
    rorelse: "Rörelsefärdigheter",
    mystik: "Mystikfärdigheter",
    social: "Sociala färdigheter",
    kunskap: "Kunskapsfärdigheter",
    sprak: "Språkfärdigheter",
    vildmark: "Vildmarksfärdigheter",
    ovriga: "Övriga färdigheter"
}

eon.kroppsdelar = {
    grund : {
        huvud: "Huvud",
        torso: "Torso",
        vansterarm: "Vänster arm",
        hogerarm: "Höger arm",
        vansterben: "Vänster ben",
        hogerben: "Höger ben"
    }
}

eon.kroppsdelsfaktor = {
    huvud: 2,
    torso: 2,
    vansterarm: 1,
    hogerarm: 1,
    vansterben: 1,
    hogerben: 1
}

eon.vapenskador = {
    hugg: "Hugg",
    kross: "Kross",
    stick: "Stick"
}

eon.vapenavstand = {
    kort: {
        namn: "Kort",
        svarighet: 6
    },
    medellangt: {
        namn: "Medellångt",
        svarighet: 10
    },
    langt: {
        namn: "Långt",
        svarighet: 14
    },
    mycketlangt: {
        namn: "Mycket långt",
        svarighet: 18
    }
}

eon.vapengrupper = {
    slagsmal: {
        namn: "Slagsmål",
        grupp: "narstridsvapen"
    },
    dolk: {
        namn:"Dolk",
        grupp: "narstridsvapen"
    },
    kedjevapen: {
        namn:"Kedjevapen",
        grupp: "narstridsvapen"
    },
    klubba: {
        namn:"Klubba",
        grupp: "narstridsvapen"
    },
    spjut: {
        namn:"Spjut",
        grupp: "narstridsvapen"
    },
    stav: {
        namn:"Stav",
        grupp: "narstridsvapen"
    },
    svard: {
        namn:"Svärd",
        grupp: "narstridsvapen"
    },
    yxa: {
        namn:"Yxa",
        grupp: "narstridsvapen"
    },
    armborst: {
        namn:"Armborst",
        grupp: "avstandsvapen"
    },
    bage: {
        namn:"Båge",
        grupp: "avstandsvapen"
    },
    kastvapen: {
        namn:"Kastvapen",
        grupp: "avstandsvapen"
    },
    skold: {
        namn:"Sköld",
        grupp: "forsvar"
    }
}

eon.aspekter = { 
    astrotropi: "Astrotropi",
    ataxotropi: "Ataxotropi",
    biotropi: "Biotropi",
    daimotropi: "Daimotropi",
    fototropi: "Fototropi",
    geotropi: "Geotropi",
    heliotropi: "Heliotropi",
    hydrotropi: "Hydrotropi",
    ikonotropi: "Ikonotropi",
    kosmotropi: "Kosmotropi",
    kronotropi: "Kronotropi",
    kryotropi: "Kryotropi",
    nekrotropi: "Nekrotropi",
    nomotropi: "Nomotropi",
    oneirotropi: "Oneirotropi",
    pneumotropi: "Pneumotropi",
    psykotropi: "Psykotropi",
    pyrotropi: "Pyrotropi",
    selenotropi: "Selenotropi",
    semotropi: "Semotropi",
    skototropi: "Skototropi",
    teotropi: "Teotropi",
    termotropi: "Termotropi",
    topotropi: "Topotropi"
}

eon.magi = {
    faltstorning : { 
        flimmer: "Fältflimmer",
        mattlig: "Måttlig fältstörning",
        allvarlig: "Allvarlig fältstörning",
        kritisk: "Kritisk fältstörning"
    },
    varaktighet: {
        1: "Scen",
        2: "Åtta timmar",
        3: "Ett dygn",
        4: "Tre dygn",
        5: "En vecka",
        6: "Två veckor",
        7: "En månad",
        8: "Två månader",
        9: "Ett kvartal",
        10: "Ett halvår",
        11: "Ett år"
    },
    omradesomfang: {
        1: "Extremt litet",
        2: "Mycket litet",
        3: "Litet",
        4: "Medelstort",
        5: "Stort",
        6: "Mycket stort",
        7: "1 kilometer stort"
    },
    rackvidd: {
        1: "Intill",
        2: "Kort",
        3: "Meddlångt",
        4: "Långt",
        5: "Mycket långt",
        6: "500 meter",
        7: "1 kilometer"
    }
}

eon.utrustningsgrupper = {
    personlig: "Personlig utrustning",
    husgrad: "Husgråd",
    spel: "Spel",
    belysning: "Belysning & elddon",
    forvaring: "Förvaring",
    special: "Specialutrustning",
    vapen: "Vapentillbehör",
    lakare: "Läkareutrustning",
    tyg: "Tyg & skinn",
    huvudbonad: "Huvudbonader",
    klader: "Kläder",
    skodon: "Skodon",
    vildmark: "Vildmarksutrustning",
    jakt: "Jaktutrustning",
    fiske: "Fiskeutrustning",
    klatter: "Klätterutrustning",
    verktyg: "Verktyg",
    musik: "Musikinstrument",
    behallare: "Behållare",
    skrivdon: "Skrivdon",
    proviant: "Proviant"
}

eon.djurgrupper = {
    litenvarelse: "Liten varelse",
    meddelstorvarelse: "Medelstor varelse",
    storvarelse: "Stor varelse",
    mycketstorvarelse: "Mycket stor varelse"
}