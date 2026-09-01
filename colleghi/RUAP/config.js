const CONFIG = {
  // Bump this when you change doctors, assignments, or other config data
  // so existing users get prompted to update their localStorage
  "configDataVersion": "2026-09-01T13:21:13Z",
  "places": [
    "M.S.Savino",
    "Subbiano",
    "Baldaccio",
    "Guadagnoli"
  ],
  "slots": [
    {
      "key": "mat",
      "label": "08:00–14:00",
      "hours": 6,
      "icon": "🌅"
    },
    {
      "key": "pom",
      "label": "14:00–20:00",
      "hours": 6,
      "icon": "🌆"
    }
  ],
  "doctors": [
    {
      "id": "mqgp5xpec24f6",
      "name": "Dott. Savianu",
      "patients": 225,
      "weeklyHours": 38,
      "isPool": false,
      "colorIndex": 0,
      "preferredPlace": "Subbiano",
      "availability": {
        "lun": {
          "mat": true,
          "pom": false
        },
        "mar": {
          "mat": false,
          "pom": true
        },
        "mer": {
          "mat": true,
          "pom": false
        },
        "gio": {
          "mat": false,
          "pom": true
        },
        "ven": {
          "mat": true,
          "pom": false
        }
      },
      "unavailPeriods": [
        {
          "from": "2026-07-10",
          "to": "2026-07-10"
        },
        {
          "from": "2026-07-27",
          "to": "2026-07-31"
        }
      ],
      "monthlyBudget": 152
    },
    {
      "id": "mqgp5xpev7h1m",
      "name": "Dott. Fiori",
      "patients": 126,
      "weeklyHours": 38,
      "isPool": false,
      "colorIndex": 1,
      "preferredPlace": "Subbiano",
      "availability": {
        "lun": {
          "mat": true,
          "pom": true
        },
        "mar": {
          "mat": true,
          "pom": true
        },
        "mer": {
          "mat": true,
          "pom": true
        },
        "gio": {
          "mat": true,
          "pom": true
        },
        "ven": {
          "mat": true,
          "pom": true
        }
      },
      "unavailPeriods": [
        {
          "from": "2026-08-01",
          "to": "2026-08-31"
        },
        {
          "from": "2026-09-01",
          "to": "2026-09-30"
        }
      ],
      "monthlyBudget": 152
    },
    {
      "id": "mqgp5xpe79zho",
      "name": "Dott. Cerofolini",
      "patients": 133,
      "weeklyHours": 38,
      "isPool": false,
      "colorIndex": 2,
      "preferredPlace": "Subbiano",
      "availability": {
        "lun": {
          "mat": true,
          "pom": false
        },
        "mar": {
          "mat": false,
          "pom": true
        },
        "mer": {
          "mat": true,
          "pom": false
        },
        "gio": {
          "mat": false,
          "pom": true
        },
        "ven": {
          "mat": false,
          "pom": true
        }
      },
      "unavailPeriods": [
        {
          "from": "2026-07-01",
          "to": "2026-07-03"
        },
        {
          "from": "2026-07-21",
          "to": "2026-07-21"
        },
        {
          "from": "2026-09-03",
          "to": "2026-09-03"
        },
        {
          "from": "2026-09-04",
          "to": "2026-09-04"
        },
        {
          "from": "2026-09-18",
          "to": "2026-09-18"
        }
      ],
      "monthlyBudget": 152
    },
    {
      "id": "mqgp5xpemfnc0",
      "name": "Dott. Gavetta",
      "patients": 648,
      "weeklyHours": 24,
      "isPool": false,
      "colorIndex": 3,
      "preferredPlace": null,
      "availability": {
        "lun": {
          "mat": false,
          "pom": true
        },
        "mar": {
          "mat": true,
          "pom": false
        },
        "mer": {
          "mat": false,
          "pom": true
        },
        "gio": {
          "mat": true,
          "pom": false
        },
        "ven": {
          "mat": false,
          "pom": true
        }
      },
      "unavailPeriods": [
        {
          "from": "2026-07-21",
          "to": "2026-07-21"
        },
        {
          "from": "2026-09-01",
          "to": "2026-09-01"
        },
        {
          "from": "2026-09-08",
          "to": "2026-09-08"
        },
        {
          "from": "2026-09-29",
          "to": "2026-09-29"
        },
        {
          "from": "2026-09-22",
          "to": "2026-09-22"
        },
        {
          "from": "2026-09-14",
          "to": "2026-09-14"
        },
        {
          "from": "2026-09-15",
          "to": "2026-09-15"
        },
        {
          "from": "2026-09-16",
          "to": "2026-09-16"
        },
        {
          "from": "2026-09-17",
          "to": "2026-09-17"
        },
        {
          "from": "2026-09-18",
          "to": "2026-09-18"
        }
      ],
      "monthlyBudget": 96
    },
    {
      "id": "mqgp5xpehbrke",
      "name": "Dott. Sodo",
      "patients": 1220,
      "weeklyHours": 6,
      "isPool": false,
      "colorIndex": 4,
      "preferredPlace": "Subbiano",
      "availability": {
        "lun": {
          "mat": false,
          "pom": true
        },
        "mar": {
          "mat": true,
          "pom": false
        },
        "mer": {
          "mat": false,
          "pom": true
        },
        "gio": {
          "mat": false,
          "pom": true
        },
        "ven": {
          "mat": true,
          "pom": false
        }
      },
      "unavailPeriods": [
        {
          "from": "2026-09-01",
          "to": "2026-09-01"
        },
        {
          "from": "2026-09-02",
          "to": "2026-09-02"
        },
        {
          "from": "2026-09-03",
          "to": "2026-09-03"
        },
        {
          "from": "2026-09-04",
          "to": "2026-09-04"
        },
        {
          "from": "2026-09-07",
          "to": "2026-09-07"
        },
        {
          "from": "2026-09-08",
          "to": "2026-09-08"
        }
      ],
      "monthlyBudget": 48
    },
    {
      "id": "mqgp5xpe8eeqy",
      "name": "Dott. Bensi",
      "patients": 1126,
      "weeklyHours": 12,
      "isPool": false,
      "colorIndex": 5,
      "preferredPlace": "Subbiano",
      "availability": {
        "lun": {
          "mat": false,
          "pom": true
        },
        "mar": {
          "mat": true,
          "pom": false
        },
        "mer": {
          "mat": false,
          "pom": true
        },
        "gio": {
          "mat": false,
          "pom": true
        },
        "ven": {
          "mat": true,
          "pom": false
        }
      },
      "unavailPeriods": [
        {
          "from": "2026-08-13",
          "to": "2026-08-13"
        },
        {
          "from": "2026-09-07",
          "to": "2026-09-07"
        },
        {
          "from": "2026-09-08",
          "to": "2026-09-08"
        },
        {
          "from": "2026-09-09",
          "to": "2026-09-09"
        },
        {
          "from": "2026-09-10",
          "to": "2026-09-10"
        },
        {
          "from": "2026-09-11",
          "to": "2026-09-11"
        }
      ],
      "monthlyBudget": 45
    },
    {
      "id": "mqgp5xpe3wotk",
      "name": "Dott. Gabrielli",
      "patients": 52,
      "weeklyHours": 38,
      "isPool": false,
      "colorIndex": 6,
      "preferredPlace": "M.S.Savino",
      "availability": {
        "lun": {
          "mat": true,
          "pom": false
        },
        "mar": {
          "mat": false,
          "pom": true
        },
        "mer": {
          "mat": true,
          "pom": false
        },
        "gio": {
          "mat": true,
          "pom": false
        },
        "ven": {
          "mat": false,
          "pom": true
        }
      },
      "unavailPeriods": [
        {
          "from": "2026-08-14",
          "to": "2026-08-14"
        },
        {
          "from": "2026-08-06",
          "to": "2026-08-06"
        },
        {
          "from": "2026-09-14",
          "to": "2026-09-25"
        }
      ],
      "monthlyBudget": 152
    },
    {
      "id": "mqgp5xpeohiai",
      "name": "Dott. Graziotti",
      "patients": 60,
      "weeklyHours": 38,
      "isPool": false,
      "colorIndex": 7,
      "preferredPlace": "M.S.Savino",
      "availability": {
        "lun": {
          "mat": true,
          "pom": false
        },
        "mar": {
          "mat": true,
          "pom": false
        },
        "mer": {
          "mat": false,
          "pom": true
        },
        "gio": {
          "mat": true,
          "pom": false
        },
        "ven": {
          "mat": false,
          "pom": true
        }
      },
      "unavailPeriods": [
        {
          "from": "2026-07-17",
          "to": "2026-07-17"
        },
        {
          "from": "2026-07-24",
          "to": "2026-07-24"
        },
        {
          "from": "2026-09-11",
          "to": "2026-09-11"
        },
        {
          "from": "2026-09-28",
          "to": "2026-09-28"
        },
        {
          "from": "2026-09-29",
          "to": "2026-09-29"
        },
        {
          "from": "2026-09-30",
          "to": "2026-09-30"
        }
      ],
      "monthlyBudget": 152
    },
    {
      "id": "mqgp5xpekiw12",
      "name": "Dott. Miroballo",
      "patients": 554,
      "weeklyHours": 24,
      "isPool": false,
      "colorIndex": 8,
      "preferredPlace": "M.S.Savino",
      "availability": {
        "lun": {
          "mat": false,
          "pom": true
        },
        "mar": {
          "mat": false,
          "pom": false
        },
        "mer": {
          "mat": false,
          "pom": true
        },
        "gio": {
          "mat": false,
          "pom": true
        },
        "ven": {
          "mat": false,
          "pom": false
        }
      },
      "unavailPeriods": [],
      "monthlyBudget": 96
    },
    {
      "id": "mqgp5xpe6gb6b",
      "name": "Dott. Zuppardo",
      "patients": 1,
      "weeklyHours": 38,
      "isPool": false,
      "colorIndex": 9,
      "preferredPlace": "Subbiano",
      "availability": {
        "lun": {
          "mat": true,
          "pom": false
        },
        "mar": {
          "mat": false,
          "pom": true
        },
        "mer": {
          "mat": true,
          "pom": false
        },
        "gio": {
          "mat": true,
          "pom": false
        },
        "ven": {
          "mat": false,
          "pom": true
        }
      },
      "unavailPeriods": [
        {
          "from": "2026-08-03",
          "to": "2026-08-03"
        },
        {
          "from": "2026-08-17",
          "to": "2026-08-17"
        },
        {
          "from": "2026-08-21",
          "to": "2026-08-21"
        },
        {
          "from": "2026-08-28",
          "to": "2026-08-28"
        },
        {
          "from": "2026-09-03",
          "to": "2026-09-03"
        },
        {
          "from": "2026-09-04",
          "to": "2026-09-04"
        },
        {
          "from": "2026-09-11",
          "to": "2026-09-11"
        },
        {
          "from": "2026-09-07",
          "to": "2026-09-07"
        },
        {
          "from": "2026-09-18",
          "to": "2026-09-18"
        },
        {
          "from": "2026-09-21",
          "to": "2026-09-21"
        }
      ],
      "monthlyBudget": 152
    },
    {
      "id": "mrasudwdk87n",
      "name": "Olivieri",
      "patients": 0,
      "weeklyHours": 38,
      "isPool": false,
      "colorIndex": 15,
      "preferredPlace": null,
      "availability": {
        "lun": {
          "mat": false,
          "pom": true
        },
        "mar": {
          "mat": true,
          "pom": false
        },
        "mer": {
          "mat": false,
          "pom": true
        },
        "gio": {
          "mat": true,
          "pom": false
        },
        "ven": {
          "mat": false,
          "pom": true
        }
      },
      "unavailPeriods": [
        {
          "from": "2026-09-02",
          "to": "2026-09-02"
        },
        {
          "from": "2026-09-24",
          "to": "2026-09-24"
        },
        {
          "from": "2026-09-25",
          "to": "2026-09-25"
        },
        {
          "from": "2026-09-28",
          "to": "2026-09-28"
        }
      ]
    }
  ],
  "assignments": {
    "2026-08-03_mat_M.S.Savino": "mqgp5xpe79zho",
    "2026-08-03_mat_Subbiano": "mqgp5xpec24f6",
    "2026-08-03_pom_M.S.Savino": "mqgp5xpemfnc0",
    "2026-08-03_pom_Subbiano": "mrasudwdk87n",
    "2026-08-04_mat_M.S.Savino": "mqgp5xpeohiai",
    "2026-08-04_mat_Subbiano": "mqgp5xpemfnc0",
    "2026-08-04_pom_M.S.Savino": "mqgp5xpe3wotk",
    "2026-08-04_pom_Subbiano": "mqgp5xpe6gb6b",
    "2026-08-05_mat_M.S.Savino": "mqgp5xpe79zho",
    "2026-08-05_mat_Subbiano": "mqgp5xpec24f6",
    "2026-08-05_pom_M.S.Savino": "mqgp5xpeohiai",
    "2026-08-05_pom_Subbiano": "mrasudwdk87n",
    "2026-08-06_mat_M.S.Savino": "mqgp5xpeohiai",
    "2026-08-06_mat_Subbiano": "mqgp5xpe6gb6b",
    "2026-08-06_pom_M.S.Savino": "mqgp5xpec24f6",
    "2026-08-06_pom_Subbiano": "mqgp5xpehbrke",
    "2026-08-07_mat_M.S.Savino": "mqgp5xpe8eeqy",
    "2026-08-07_mat_Subbiano": "mqgp5xpec24f6",
    "2026-08-07_pom_M.S.Savino": "mqgp5xpe3wotk",
    "2026-08-07_pom_Subbiano": "mrasudwdk87n",
    "2026-08-10_mat_M.S.Savino": "mqgp5xpeohiai",
    "2026-08-10_mat_Subbiano": "mqgp5xpe6gb6b",
    "2026-08-10_pom_M.S.Savino": "mqgp5xpekiw12",
    "2026-08-10_pom_Subbiano": "mqgp5xpemfnc0",
    "2026-08-11_mat_M.S.Savino": "mqgp5xpeohiai",
    "2026-08-11_mat_Subbiano": "mqgp5xpe8eeqy",
    "2026-08-11_pom_M.S.Savino": "mqgp5xpe79zho",
    "2026-08-11_pom_Subbiano": "mqgp5xpe3wotk",
    "2026-08-12_mat_M.S.Savino": "mqgp5xpe3wotk",
    "2026-08-12_mat_Subbiano": "mqgp5xpe6gb6b",
    "2026-08-12_pom_M.S.Savino": "mqgp5xpeohiai",
    "2026-08-12_pom_Subbiano": "mrasudwdk87n",
    "2026-08-13_mat_M.S.Savino": "mqgp5xpe3wotk",
    "2026-08-13_mat_Subbiano": "mqgp5xpe6gb6b",
    "2026-08-13_pom_Subbiano": "mqgp5xpe79zho",
    "2026-08-17_mat_M.S.Savino": "mqgp5xpe3wotk",
    "2026-08-17_mat_Subbiano": "mqgp5xpec24f6",
    "2026-08-17_pom_M.S.Savino": "mqgp5xpekiw12",
    "2026-08-17_pom_Subbiano": "mrasudwdk87n",
    "2026-08-18_mat_M.S.Savino": "mqgp5xpeohiai",
    "2026-08-18_mat_Subbiano": "mqgp5xpehbrke",
    "2026-08-18_pom_M.S.Savino": "mqgp5xpe79zho",
    "2026-08-18_pom_Subbiano": "mqgp5xpe6gb6b",
    "2026-08-19_mat_M.S.Savino": "mqgp5xpe3wotk",
    "2026-08-19_mat_Subbiano": "mqgp5xpec24f6",
    "2026-08-19_pom_M.S.Savino": "mqgp5xpeohiai",
    "2026-08-19_pom_Subbiano": "mrasudwdk87n",
    "2026-08-20_mat_M.S.Savino": "mqgp5xpeohiai",
    "2026-08-20_mat_Subbiano": "mqgp5xpe6gb6b",
    "2026-08-20_pom_M.S.Savino": "mqgp5xpe79zho",
    "2026-08-20_pom_Subbiano": "mqgp5xpec24f6",
    "2026-08-21_mat_M.S.Savino": "mqgp5xpe8eeqy",
    "2026-08-21_mat_Subbiano": "mqgp5xpec24f6",
    "2026-08-21_pom_M.S.Savino": "mqgp5xpe3wotk",
    "2026-08-21_pom_Subbiano": "mrasudwdk87n",
    "2026-08-24_mat_M.S.Savino": "mqgp5xpe79zho",
    "2026-08-24_mat_Subbiano": "mqgp5xpe6gb6b",
    "2026-08-24_pom_M.S.Savino": "mqgp5xpekiw12",
    "2026-08-24_pom_Subbiano": "mqgp5xpemfnc0",
    "2026-08-25_mat_M.S.Savino": "mqgp5xpeohiai",
    "2026-08-25_mat_Subbiano": "mrasudwdk87n",
    "2026-08-25_pom_M.S.Savino": "mqgp5xpe79zho",
    "2026-08-25_pom_Subbiano": "mqgp5xpe6gb6b",
    "2026-08-26_mat_M.S.Savino": "mqgp5xpe3wotk",
    "2026-08-26_mat_Subbiano": "mqgp5xpec24f6",
    "2026-08-26_pom_M.S.Savino": "mqgp5xpeohiai",
    "2026-08-26_pom_Subbiano": "mrasudwdk87n",
    "2026-08-27_mat_M.S.Savino": "mqgp5xpeohiai",
    "2026-08-27_mat_Subbiano": "mqgp5xpe6gb6b",
    "2026-08-27_pom_M.S.Savino": "mqgp5xpe79zho",
    "2026-08-27_pom_Subbiano": "mqgp5xpehbrke",
    "2026-08-28_mat_M.S.Savino": "mqgp5xpe8eeqy",
    "2026-08-28_mat_Subbiano": "mqgp5xpec24f6",
    "2026-08-28_pom_M.S.Savino": "mqgp5xpe3wotk",
    "2026-08-28_pom_Subbiano": "mrasudwdk87n",
    "2026-08-31_mat_M.S.Savino": "mqgp5xpe79zho",
    "2026-08-31_mat_Subbiano": "mqgp5xpe6gb6b",
    "2026-08-31_pom_M.S.Savino": "mqgp5xpekiw12",
    "2026-08-31_pom_Subbiano": "mqgp5xpemfnc0",
    "2026-08-13_pom_M.S.Savino": "mqgp5xpec24f6",
    "2026-09-01_mat_M.S.Savino": "mqgp5xpeohiai",
    "2026-09-01_mat_Subbiano": "mrasudwdk87n",
    "2026-09-01_pom_M.S.Savino": "mqgp5xpe3wotk",
    "2026-09-01_pom_Subbiano": "mqgp5xpe6gb6b",
    "2026-09-02_mat_M.S.Savino": "mqgp5xpe79zho",
    "2026-09-02_mat_Subbiano": "mqgp5xpe6gb6b",
    "2026-09-02_pom_M.S.Savino": "mqgp5xpeohiai",
    "2026-09-02_pom_Subbiano": "mqgp5xpemfnc0",
    "2026-09-03_mat_M.S.Savino": "mrasudwdk87n",
    "2026-09-03_mat_Subbiano": "mqgp5xpe3wotk",
    "2026-09-03_pom_M.S.Savino": "mqgp5xpekiw12",
    "2026-09-03_pom_Subbiano": "mqgp5xpec24f6",
    "2026-09-04_mat_M.S.Savino": "mqgp5xpe8eeqy",
    "2026-09-04_pom_M.S.Savino": "mqgp5xpeohiai",
    "2026-09-04_pom_Subbiano": "mrasudwdk87n",
    "2026-09-07_mat_M.S.Savino": "mqgp5xpe3wotk",
    "2026-09-07_mat_Subbiano": "mqgp5xpe79zho",
    "2026-09-07_pom_M.S.Savino": "mqgp5xpekiw12",
    "2026-09-07_pom_Subbiano": "mqgp5xpemfnc0",
    "2026-09-08_mat_M.S.Savino": "mqgp5xpeohiai",
    "2026-09-08_mat_Subbiano": "mrasudwdk87n",
    "2026-09-08_pom_M.S.Savino": "mqgp5xpe3wotk",
    "2026-09-08_pom_Subbiano": "mqgp5xpe6gb6b",
    "2026-09-09_mat_M.S.Savino": "mqgp5xpe79zho",
    "2026-09-09_mat_Subbiano": "mqgp5xpec24f6",
    "2026-09-09_pom_M.S.Savino": "mqgp5xpeohiai",
    "2026-09-09_pom_Subbiano": "mrasudwdk87n",
    "2026-09-10_mat_M.S.Savino": "mqgp5xpemfnc0",
    "2026-09-10_mat_Subbiano": "mqgp5xpe6gb6b",
    "2026-09-10_pom_M.S.Savino": "mqgp5xpe79zho",
    "2026-09-10_pom_Subbiano": "mqgp5xpec24f6",
    "2026-09-11_mat_M.S.Savino": "mqgp5xpec24f6",
    "2026-09-11_pom_M.S.Savino": "mqgp5xpe3wotk",
    "2026-09-11_pom_Subbiano": "mqgp5xpe79zho",
    "2026-09-14_mat_M.S.Savino": "mqgp5xpe79zho",
    "2026-09-14_mat_Subbiano": "mqgp5xpec24f6",
    "2026-09-14_pom_Subbiano": "mqgp5xpehbrke",
    "2026-09-15_mat_M.S.Savino": "mqgp5xpeohiai",
    "2026-09-15_mat_Subbiano": "mrasudwdk87n",
    "2026-09-15_pom_M.S.Savino": "mqgp5xpe79zho",
    "2026-09-15_pom_Subbiano": "mqgp5xpe6gb6b",
    "2026-09-16_mat_M.S.Savino": "mqgp5xpe79zho",
    "2026-09-16_pom_M.S.Savino": "mqgp5xpeohiai",
    "2026-09-16_pom_Subbiano": "mrasudwdk87n",
    "2026-09-17_mat_M.S.Savino": "mqgp5xpeohiai",
    "2026-09-17_mat_Subbiano": "mqgp5xpe6gb6b",
    "2026-09-17_pom_M.S.Savino": "mqgp5xpe79zho",
    "2026-09-17_pom_Subbiano": "mqgp5xpec24f6",
    "2026-09-18_mat_M.S.Savino": "mqgp5xpe8eeqy",
    "2026-09-18_mat_Subbiano": "mqgp5xpec24f6",
    "2026-09-18_pom_M.S.Savino": "mqgp5xpeohiai",
    "2026-09-18_pom_Subbiano": "mrasudwdk87n",
    "2026-09-21_mat_M.S.Savino": "mqgp5xpeohiai",
    "2026-09-21_mat_Subbiano": "mqgp5xpe79zho",
    "2026-09-21_pom_M.S.Savino": "mqgp5xpemfnc0",
    "2026-09-21_pom_Subbiano": "mrasudwdk87n",
    "2026-09-22_mat_M.S.Savino": "mqgp5xpeohiai",
    "2026-09-22_mat_Subbiano": "mqgp5xpe8eeqy",
    "2026-09-22_pom_M.S.Savino": "mqgp5xpec24f6",
    "2026-09-22_pom_Subbiano": "mqgp5xpe6gb6b",
    "2026-09-23_mat_M.S.Savino": "mqgp5xpe79zho",
    "2026-09-23_pom_M.S.Savino": "mqgp5xpekiw12",
    "2026-09-23_pom_Subbiano": "mrasudwdk87n",
    "2026-09-24_mat_M.S.Savino": "mqgp5xpeohiai",
    "2026-09-24_mat_Subbiano": "mqgp5xpe6gb6b",
    "2026-09-24_pom_M.S.Savino": "mqgp5xpe79zho",
    "2026-09-24_pom_Subbiano": "mqgp5xpev7h1m",
    "2026-09-25_mat_M.S.Savino": "mqgp5xpehbrke",
    "2026-09-25_mat_Subbiano": "mqgp5xpec24f6",
    "2026-09-25_pom_M.S.Savino": "mqgp5xpemfnc0",
    "2026-09-25_pom_Subbiano": "mqgp5xpe6gb6b",
    "2026-09-28_mat_M.S.Savino": "mqgp5xpe3wotk",
    "2026-09-28_mat_Subbiano": "mqgp5xpec24f6",
    "2026-09-28_pom_M.S.Savino": "mqgp5xpemfnc0",
    "2026-09-28_pom_Subbiano": "mqgp5xpekiw12",
    "2026-09-29_mat_M.S.Savino": "mrasudwdk87n",
    "2026-09-29_pom_M.S.Savino": "mqgp5xpe3wotk",
    "2026-09-29_pom_Subbiano": "mqgp5xpe6gb6b",
    "2026-09-30_mat_M.S.Savino": "mqgp5xpec24f6",
    "2026-09-30_mat_Subbiano": "mqgp5xpe6gb6b",
    "2026-09-30_pom_M.S.Savino": "mqgp5xpekiw12",
    "2026-09-30_pom_Subbiano": "mrasudwdk87n",
    "2026-09-16_mat_Subbiano": "mqgp5xpe6gb6b",
    "2026-09-04_mat_Subbiano": "mqgp5xpec24f6",
    "2026-09-11_mat_Subbiano": "mqgp5xpehbrke",
    "2026-09-29_mat_Subbiano": "mqgp5xpe8eeqy",
    "2026-09-23_mat_Subbiano": "mqgp5xpev7h1m",
    "2026-09-14_pom_M.S.Savino": "mqgp5xpekiw12"
  }
};
