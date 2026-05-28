/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/valhalla.json`.
 */
export type Valhalla = {
  "address": "F43KEBNRX7AkbAjvW4LQq9A698yrp6Uh6kDsKjfqAMXz",
  "metadata": {
    "name": "valhalla",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "authorizeTraining",
      "discriminator": [
        206,
        173,
        27,
        221,
        230,
        238,
        76,
        72
      ],
      "accounts": [
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "profile",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "storage",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  111,
                  114,
                  97,
                  103,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "auth",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  97,
                  105,
                  110,
                  95,
                  97,
                  117,
                  116,
                  104
                ]
              },
              {
                "kind": "account",
                "path": "player"
              },
              {
                "kind": "arg",
                "path": "nonce"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "troopType",
          "type": "u8"
        },
        {
          "name": "quantity",
          "type": "u16"
        },
        {
          "name": "nonce",
          "type": "u64"
        },
        {
          "name": "expiresIn",
          "type": "i64"
        }
      ]
    },
    {
      "name": "buyBuilding",
      "discriminator": [
        89,
        144,
        206,
        179,
        163,
        2,
        80,
        119
      ],
      "accounts": [
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "profile",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "storage",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  111,
                  114,
                  97,
                  103,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "catalogId",
          "type": "u8"
        }
      ]
    },
    {
      "name": "buySpell",
      "discriminator": [
        72,
        192,
        61,
        10,
        11,
        159,
        177,
        171
      ],
      "accounts": [
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "profile",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "storage",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  111,
                  114,
                  97,
                  103,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "spells",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  112,
                  101,
                  108,
                  108,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "spellType",
          "type": "u8"
        },
        {
          "name": "quantity",
          "type": "u8"
        }
      ]
    },
    {
      "name": "cancelUpgrade",
      "discriminator": [
        216,
        52,
        40,
        78,
        188,
        214,
        201,
        228
      ],
      "accounts": [
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "storage",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  111,
                  114,
                  97,
                  103,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "builder",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "claimLoot",
      "discriminator": [
        69,
        105,
        8,
        13,
        65,
        21,
        85,
        238
      ],
      "accounts": [
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "storage",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  111,
                  114,
                  97,
                  103,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "closeSession",
      "discriminator": [
        68,
        114,
        178,
        140,
        222,
        38,
        248,
        211
      ],
      "accounts": [
        {
          "name": "attacker",
          "writable": true,
          "signer": true
        },
        {
          "name": "session",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  97,
                  116,
                  116,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "attacker"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "closeTrainingAuth",
      "discriminator": [
        250,
        16,
        14,
        124,
        12,
        134,
        21,
        246
      ],
      "accounts": [
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "auth",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "collectMine",
      "discriminator": [
        4,
        249,
        33,
        169,
        181,
        6,
        130,
        121
      ],
      "accounts": [
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "storage",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  111,
                  114,
                  97,
                  103,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "mine",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "collectPort",
      "discriminator": [
        61,
        121,
        140,
        139,
        49,
        95,
        199,
        26
      ],
      "accounts": [
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "storage",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  111,
                  114,
                  97,
                  103,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "port",
          "docs": [
            "Port is stored as a MineState with a designated index (e.g. index 10)"
          ],
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "commitBarracks",
      "discriminator": [
        216,
        149,
        105,
        150,
        101,
        3,
        43,
        109
      ],
      "accounts": [
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "barracks",
          "writable": true
        },
        {
          "name": "magicProgram",
          "address": "Magic11111111111111111111111111111111111111"
        },
        {
          "name": "magicContext",
          "writable": true,
          "address": "MagicContext1111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "completeUpgrade",
      "discriminator": [
        3,
        35,
        98,
        10,
        239,
        180,
        49,
        168
      ],
      "accounts": [
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "profile",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "map",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  112
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "storage",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  111,
                  114,
                  97,
                  103,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "barracks",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  97,
                  114,
                  114,
                  97,
                  99,
                  107,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "builder",
          "writable": true
        },
        {
          "name": "mine",
          "optional": true
        },
        {
          "name": "farm",
          "optional": true
        }
      ],
      "args": []
    },
    {
      "name": "deductDeployed",
      "discriminator": [
        219,
        78,
        83,
        130,
        148,
        216,
        149,
        152
      ],
      "accounts": [
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "barracks",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  97,
                  114,
                  114,
                  97,
                  99,
                  107,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "delegateBarracks",
      "discriminator": [
        201,
        67,
        67,
        128,
        228,
        17,
        210,
        160
      ],
      "accounts": [
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "bufferBarracks",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  117,
                  102,
                  102,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "barracks"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                208,
                202,
                249,
                228,
                96,
                186,
                138,
                252,
                194,
                60,
                152,
                237,
                182,
                202,
                107,
                227,
                84,
                147,
                240,
                176,
                135,
                200,
                52,
                240,
                137,
                157,
                43,
                70,
                215,
                178,
                35,
                125
              ]
            }
          }
        },
        {
          "name": "delegationRecordBarracks",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "barracks"
              }
            ],
            "program": {
              "kind": "account",
              "path": "delegationProgram"
            }
          }
        },
        {
          "name": "delegationMetadataBarracks",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  105,
                  111,
                  110,
                  45,
                  109,
                  101,
                  116,
                  97,
                  100,
                  97,
                  116,
                  97
                ]
              },
              {
                "kind": "account",
                "path": "barracks"
              }
            ],
            "program": {
              "kind": "account",
              "path": "delegationProgram"
            }
          }
        },
        {
          "name": "barracks",
          "writable": true
        },
        {
          "name": "ownerProgram",
          "address": "F43KEBNRX7AkbAjvW4LQq9A698yrp6Uh6kDsKjfqAMXz"
        },
        {
          "name": "delegationProgram",
          "address": "DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "delegateMap",
      "discriminator": [
        151,
        157,
        106,
        211,
        59,
        88,
        21,
        57
      ],
      "accounts": [
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "profile",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "bufferMap",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  117,
                  102,
                  102,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "map"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                208,
                202,
                249,
                228,
                96,
                186,
                138,
                252,
                194,
                60,
                152,
                237,
                182,
                202,
                107,
                227,
                84,
                147,
                240,
                176,
                135,
                200,
                52,
                240,
                137,
                157,
                43,
                70,
                215,
                178,
                35,
                125
              ]
            }
          }
        },
        {
          "name": "delegationRecordMap",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "map"
              }
            ],
            "program": {
              "kind": "account",
              "path": "delegationProgram"
            }
          }
        },
        {
          "name": "delegationMetadataMap",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  105,
                  111,
                  110,
                  45,
                  109,
                  101,
                  116,
                  97,
                  100,
                  97,
                  116,
                  97
                ]
              },
              {
                "kind": "account",
                "path": "map"
              }
            ],
            "program": {
              "kind": "account",
              "path": "delegationProgram"
            }
          }
        },
        {
          "name": "map",
          "writable": true
        },
        {
          "name": "ownerProgram",
          "address": "F43KEBNRX7AkbAjvW4LQq9A698yrp6Uh6kDsKjfqAMXz"
        },
        {
          "name": "delegationProgram",
          "address": "DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "delegateSession",
      "discriminator": [
        82,
        83,
        119,
        119,
        196,
        219,
        5,
        197
      ],
      "accounts": [
        {
          "name": "attacker",
          "writable": true,
          "signer": true
        },
        {
          "name": "bufferSession",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  117,
                  102,
                  102,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "session"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                208,
                202,
                249,
                228,
                96,
                186,
                138,
                252,
                194,
                60,
                152,
                237,
                182,
                202,
                107,
                227,
                84,
                147,
                240,
                176,
                135,
                200,
                52,
                240,
                137,
                157,
                43,
                70,
                215,
                178,
                35,
                125
              ]
            }
          }
        },
        {
          "name": "delegationRecordSession",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "session"
              }
            ],
            "program": {
              "kind": "account",
              "path": "delegationProgram"
            }
          }
        },
        {
          "name": "delegationMetadataSession",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  105,
                  111,
                  110,
                  45,
                  109,
                  101,
                  116,
                  97,
                  100,
                  97,
                  116,
                  97
                ]
              },
              {
                "kind": "account",
                "path": "session"
              }
            ],
            "program": {
              "kind": "account",
              "path": "delegationProgram"
            }
          }
        },
        {
          "name": "session",
          "writable": true
        },
        {
          "name": "ownerProgram",
          "address": "F43KEBNRX7AkbAjvW4LQq9A698yrp6Uh6kDsKjfqAMXz"
        },
        {
          "name": "delegationProgram",
          "address": "DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "endBattle",
      "discriminator": [
        80,
        145,
        208,
        48,
        183,
        92,
        168,
        112
      ],
      "accounts": [
        {
          "name": "attacker",
          "writable": true,
          "signer": true
        },
        {
          "name": "session",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  97,
                  116,
                  116,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "attacker"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "stars",
          "type": "u8"
        },
        {
          "name": "goldLooted",
          "type": "u64"
        },
        {
          "name": "foodLooted",
          "type": "u64"
        }
      ]
    },
    {
      "name": "harvestFood",
      "discriminator": [
        215,
        204,
        35,
        139,
        79,
        206,
        49,
        171
      ],
      "accounts": [
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "storage",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  111,
                  114,
                  97,
                  103,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "farm",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "initFarm",
      "discriminator": [
        11,
        189,
        249,
        5,
        133,
        54,
        66,
        231
      ],
      "accounts": [
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "farm",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "index",
          "type": "u8"
        }
      ]
    },
    {
      "name": "initMine",
      "discriminator": [
        164,
        52,
        17,
        174,
        24,
        73,
        72,
        115
      ],
      "accounts": [
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "mine",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "index",
          "type": "u8"
        }
      ]
    },
    {
      "name": "initializePlayer",
      "discriminator": [
        79,
        249,
        88,
        177,
        220,
        62,
        56,
        128
      ],
      "accounts": [
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "profile",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "map",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  112
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "storage",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  111,
                  114,
                  97,
                  103,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "barracks",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  97,
                  114,
                  114,
                  97,
                  99,
                  107,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "upgrades",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  112,
                  103,
                  114,
                  97,
                  100,
                  101,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "spells",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  112,
                  101,
                  108,
                  108,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "builder0",
          "writable": true
        },
        {
          "name": "builder1",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initializeSession",
      "discriminator": [
        69,
        130,
        92,
        236,
        107,
        231,
        159,
        129
      ],
      "accounts": [
        {
          "name": "attacker",
          "writable": true,
          "signer": true
        },
        {
          "name": "attackerProfile",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "attacker"
              }
            ]
          }
        },
        {
          "name": "attackerBarracks",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  97,
                  114,
                  114,
                  97,
                  99,
                  107,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "attacker"
              }
            ]
          }
        },
        {
          "name": "attackerSpells",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  112,
                  101,
                  108,
                  108,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "attacker"
              }
            ]
          }
        },
        {
          "name": "defenderProfile",
          "docs": [
            "Defender accounts (read-only)"
          ]
        },
        {
          "name": "defenderStorage"
        },
        {
          "name": "defenderMine0",
          "optional": true
        },
        {
          "name": "defenderMine1",
          "optional": true
        },
        {
          "name": "defenderMine2",
          "optional": true
        },
        {
          "name": "session",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  97,
                  116,
                  116,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "attacker"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "markForBattle",
      "discriminator": [
        221,
        102,
        57,
        161,
        200,
        45,
        182,
        78
      ],
      "accounts": [
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "barracks",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  97,
                  114,
                  114,
                  97,
                  99,
                  107,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "battleCounts",
          "type": {
            "array": [
              "u16",
              9
            ]
          }
        }
      ]
    },
    {
      "name": "processUndelegation",
      "discriminator": [
        196,
        28,
        41,
        206,
        48,
        37,
        51,
        167
      ],
      "accounts": [
        {
          "name": "baseAccount",
          "writable": true
        },
        {
          "name": "buffer"
        },
        {
          "name": "payer",
          "writable": true
        },
        {
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "accountSeeds",
          "type": {
            "vec": "bytes"
          }
        }
      ]
    },
    {
      "name": "saveMap",
      "discriminator": [
        23,
        246,
        139,
        73,
        212,
        65,
        55,
        37
      ],
      "accounts": [
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "profile",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "map",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  112
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "slotType",
          "type": {
            "array": [
              "u8",
              50
            ]
          }
        },
        {
          "name": "slotLevel",
          "type": {
            "array": [
              "u8",
              50
            ]
          }
        },
        {
          "name": "slotRow",
          "type": {
            "array": [
              "u8",
              50
            ]
          }
        },
        {
          "name": "slotCol",
          "type": {
            "array": [
              "u8",
              50
            ]
          }
        }
      ]
    },
    {
      "name": "saveMapEr",
      "discriminator": [
        51,
        219,
        55,
        45,
        213,
        99,
        48,
        91
      ],
      "accounts": [
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "profile",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "map",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  112
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "slotType",
          "type": {
            "array": [
              "u8",
              50
            ]
          }
        },
        {
          "name": "slotLevel",
          "type": {
            "array": [
              "u8",
              50
            ]
          }
        },
        {
          "name": "slotRow",
          "type": {
            "array": [
              "u8",
              50
            ]
          }
        },
        {
          "name": "slotCol",
          "type": {
            "array": [
              "u8",
              50
            ]
          }
        }
      ]
    },
    {
      "name": "settleBattle",
      "discriminator": [
        4,
        146,
        32,
        157,
        82,
        216,
        214,
        28
      ],
      "accounts": [
        {
          "name": "attacker",
          "writable": true,
          "signer": true
        },
        {
          "name": "attackerProfile",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "attacker"
              }
            ]
          }
        },
        {
          "name": "attackerVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "attacker"
              }
            ]
          }
        },
        {
          "name": "session",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  97,
                  116,
                  116,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "attacker"
              }
            ]
          }
        },
        {
          "name": "defenderStorage",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  111,
                  114,
                  97,
                  103,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "session.defender",
                "account": "battleSession"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "slotSpell",
      "discriminator": [
        153,
        149,
        17,
        164,
        210,
        175,
        46,
        12
      ],
      "accounts": [
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "spells",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  112,
                  101,
                  108,
                  108,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "slot",
          "type": "u8"
        },
        {
          "name": "spellType",
          "type": "u8"
        }
      ]
    },
    {
      "name": "spawnTroops",
      "discriminator": [
        119,
        157,
        109,
        64,
        128,
        187,
        10,
        0
      ],
      "accounts": [
        {
          "name": "attacker",
          "writable": true,
          "signer": true
        },
        {
          "name": "session",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  97,
                  116,
                  116,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "attacker"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "troopType",
          "type": "u8"
        },
        {
          "name": "count",
          "type": "u16"
        }
      ]
    },
    {
      "name": "startUpgrade",
      "discriminator": [
        134,
        190,
        143,
        225,
        188,
        141,
        38,
        116
      ],
      "accounts": [
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "profile",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "map",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  112
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "storage",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  111,
                  114,
                  97,
                  103,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "builder",
          "docs": [
            "Builder index provided in instruction via seeds"
          ],
          "writable": true
        }
      ],
      "args": [
        {
          "name": "slotIndex",
          "type": "u8"
        },
        {
          "name": "catalogId",
          "type": "u8"
        }
      ]
    },
    {
      "name": "syncProfile",
      "discriminator": [
        87,
        195,
        142,
        232,
        202,
        68,
        47,
        165
      ],
      "accounts": [
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "profile",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "map",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  112
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "trainTroops",
      "discriminator": [
        233,
        145,
        128,
        20,
        178,
        145,
        93,
        109
      ],
      "accounts": [
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "barracks",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  97,
                  114,
                  114,
                  97,
                  99,
                  107,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "auth",
          "docs": [
            "Mainnet account; read-only on ER"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "undelegateBarracks",
      "discriminator": [
        84,
        102,
        72,
        108,
        235,
        224,
        97,
        230
      ],
      "accounts": [
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "barracks",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  97,
                  114,
                  114,
                  97,
                  99,
                  107,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "undelegateMap",
      "discriminator": [
        19,
        245,
        67,
        166,
        250,
        172,
        37,
        195
      ],
      "accounts": [
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "map",
          "writable": true
        },
        {
          "name": "magicProgram",
          "address": "Magic11111111111111111111111111111111111111"
        },
        {
          "name": "magicContext",
          "writable": true,
          "address": "MagicContext1111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "upgradeTroop",
      "discriminator": [
        80,
        47,
        58,
        210,
        65,
        186,
        109,
        240
      ],
      "accounts": [
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "profile",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "storage",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  111,
                  114,
                  97,
                  103,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "upgrades",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  112,
                  103,
                  114,
                  97,
                  100,
                  101,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "troopType",
          "type": "u8"
        }
      ]
    },
    {
      "name": "useSpell",
      "discriminator": [
        221,
        203,
        96,
        89,
        14,
        255,
        135,
        120
      ],
      "accounts": [
        {
          "name": "attacker",
          "writable": true,
          "signer": true
        },
        {
          "name": "session",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  97,
                  116,
                  116,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "attacker"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "slot",
          "type": "u8"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "battleSession",
      "discriminator": [
        254,
        114,
        29,
        174,
        211,
        191,
        25,
        241
      ]
    },
    {
      "name": "builderState",
      "discriminator": [
        129,
        97,
        165,
        231,
        78,
        250,
        54,
        233
      ]
    },
    {
      "name": "farmState",
      "discriminator": [
        198,
        102,
        216,
        74,
        63,
        66,
        163,
        190
      ]
    },
    {
      "name": "lootVault",
      "discriminator": [
        225,
        57,
        198,
        178,
        124,
        161,
        205,
        195
      ]
    },
    {
      "name": "mineState",
      "discriminator": [
        21,
        124,
        38,
        83,
        205,
        134,
        181,
        81
      ]
    },
    {
      "name": "playerMap",
      "discriminator": [
        234,
        31,
        224,
        69,
        245,
        4,
        147,
        250
      ]
    },
    {
      "name": "playerProfile",
      "discriminator": [
        82,
        226,
        99,
        87,
        164,
        130,
        181,
        80
      ]
    },
    {
      "name": "spellHand",
      "discriminator": [
        97,
        174,
        236,
        28,
        204,
        84,
        40,
        179
      ]
    },
    {
      "name": "storageState",
      "discriminator": [
        238,
        246,
        205,
        181,
        230,
        225,
        131,
        59
      ]
    },
    {
      "name": "trainingAuth",
      "discriminator": [
        176,
        215,
        102,
        21,
        145,
        55,
        131,
        195
      ]
    },
    {
      "name": "troopBarracks",
      "discriminator": [
        232,
        52,
        96,
        186,
        208,
        188,
        0,
        4
      ]
    },
    {
      "name": "troopUpgrades",
      "discriminator": [
        73,
        185,
        215,
        232,
        233,
        91,
        7,
        201
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "maxLevelReached",
      "msg": "Max level reached"
    },
    {
      "code": 6001,
      "name": "insufficientXp",
      "msg": "Insufficient XP"
    },
    {
      "code": 6002,
      "name": "tcLevelTooLow",
      "msg": "TC level too low for this building"
    },
    {
      "code": 6003,
      "name": "maxBuildingCount",
      "msg": "Max building count reached"
    },
    {
      "code": 6004,
      "name": "slotOccupied",
      "msg": "Building slot already occupied"
    },
    {
      "code": 6005,
      "name": "buildingNotFound",
      "msg": "Building not found at given slot"
    },
    {
      "code": 6006,
      "name": "shopPurchaseRequired",
      "msg": "Building must be purchased from shop first"
    },
    {
      "code": 6007,
      "name": "builderBusy",
      "msg": "Builder not idle"
    },
    {
      "code": 6008,
      "name": "noIdleBuilder",
      "msg": "No idle builder available"
    },
    {
      "code": 6009,
      "name": "noUpgradeInProgress",
      "msg": "Upgrade not in progress"
    },
    {
      "code": 6010,
      "name": "upgradeNotReady",
      "msg": "Upgrade timer not finished"
    },
    {
      "code": 6011,
      "name": "maxUpgradeLevel",
      "msg": "Max upgrade level reached"
    },
    {
      "code": 6012,
      "name": "invalidCatalogId",
      "msg": "Invalid catalog ID"
    },
    {
      "code": 6013,
      "name": "insufficientGold",
      "msg": "Insufficient gold"
    },
    {
      "code": 6014,
      "name": "insufficientFood",
      "msg": "Insufficient food"
    },
    {
      "code": 6015,
      "name": "storageFull",
      "msg": "Storage full"
    },
    {
      "code": 6016,
      "name": "nothingToCollect",
      "msg": "Nothing to collect"
    },
    {
      "code": 6017,
      "name": "popCapReached",
      "msg": "Population cap reached"
    },
    {
      "code": 6018,
      "name": "insufficientTroopPop",
      "msg": "Insufficient troop population"
    },
    {
      "code": 6019,
      "name": "barracksLevelTooLow",
      "msg": "Troop type requires higher barracks level"
    },
    {
      "code": 6020,
      "name": "invalidTroopType",
      "msg": "Invalid troop type"
    },
    {
      "code": 6021,
      "name": "troopAlreadyUpgraded",
      "msg": "Troop already upgraded"
    },
    {
      "code": 6022,
      "name": "insufficientTroops",
      "msg": "Insufficient troops for battle"
    },
    {
      "code": 6023,
      "name": "authAlreadyConsumed",
      "msg": "Training auth already consumed"
    },
    {
      "code": 6024,
      "name": "authNonceMismatch",
      "msg": "Training auth nonce mismatch"
    },
    {
      "code": 6025,
      "name": "authExpired",
      "msg": "Training auth expired"
    },
    {
      "code": 6026,
      "name": "invalidSpellType",
      "msg": "Invalid spell type"
    },
    {
      "code": 6027,
      "name": "marketLevelTooLow",
      "msg": "Spell requires higher market level"
    },
    {
      "code": 6028,
      "name": "spellInventoryFull",
      "msg": "Spell inventory full"
    },
    {
      "code": 6029,
      "name": "insufficientSpells",
      "msg": "Insufficient spells"
    },
    {
      "code": 6030,
      "name": "invalidSpellSlot",
      "msg": "Invalid spell slot"
    },
    {
      "code": 6031,
      "name": "sessionAlreadyActive",
      "msg": "Battle session already active"
    },
    {
      "code": 6032,
      "name": "sessionNotActive",
      "msg": "Battle session not active"
    },
    {
      "code": 6033,
      "name": "battleAlreadyEnded",
      "msg": "Battle already ended"
    },
    {
      "code": 6034,
      "name": "invalidStarCount",
      "msg": "Invalid star count"
    },
    {
      "code": 6035,
      "name": "lootExceedsCap",
      "msg": "Loot exceeds allowed cap"
    },
    {
      "code": 6036,
      "name": "defenderNotFound",
      "msg": "Defender not found"
    },
    {
      "code": 6037,
      "name": "cannotAttackSelf",
      "msg": "Cannot attack self"
    },
    {
      "code": 6038,
      "name": "attackerMapNotSettled",
      "msg": "Attacker map not settled"
    },
    {
      "code": 6039,
      "name": "notDelegated",
      "msg": "Account must be delegated for this operation"
    },
    {
      "code": 6040,
      "name": "alreadyDelegated",
      "msg": "Account already delegated"
    },
    {
      "code": 6041,
      "name": "unauthorizedEr",
      "msg": "Unauthorized caller on ER"
    },
    {
      "code": 6042,
      "name": "overflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6043,
      "name": "underflow",
      "msg": "Arithmetic underflow"
    }
  ],
  "types": [
    {
      "name": "battleSession",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "attacker",
            "type": "pubkey"
          },
          {
            "name": "defender",
            "type": "pubkey"
          },
          {
            "name": "startTs",
            "type": "i64"
          },
          {
            "name": "endTs",
            "type": "i64"
          },
          {
            "name": "active",
            "type": "bool"
          },
          {
            "name": "stars",
            "type": "u8"
          },
          {
            "name": "mineBuffers",
            "type": {
              "array": [
                "u64",
                3
              ]
            }
          },
          {
            "name": "storageSnapshot",
            "type": "u64"
          },
          {
            "name": "goldLooted",
            "type": "u64"
          },
          {
            "name": "foodLooted",
            "type": "u64"
          },
          {
            "name": "troopCounts",
            "type": {
              "array": [
                "u16",
                9
              ]
            }
          },
          {
            "name": "spellCounts",
            "type": {
              "array": [
                "u8",
                5
              ]
            }
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "padding",
            "type": {
              "array": [
                "u8",
                93
              ]
            }
          }
        ]
      }
    },
    {
      "name": "builderState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "index",
            "type": "u8"
          },
          {
            "name": "busy",
            "type": "bool"
          },
          {
            "name": "catalogId",
            "type": "u8"
          },
          {
            "name": "slotIndex",
            "type": "u8"
          },
          {
            "name": "newLevel",
            "type": "u8"
          },
          {
            "name": "finishTs",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "padding",
            "type": {
              "array": [
                "u8",
                61
              ]
            }
          }
        ]
      }
    },
    {
      "name": "farmState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "index",
            "type": "u8"
          },
          {
            "name": "level",
            "type": "u8"
          },
          {
            "name": "lastHarvestTs",
            "type": "i64"
          },
          {
            "name": "buffer",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "padding",
            "type": {
              "array": [
                "u8",
                13
              ]
            }
          }
        ]
      }
    },
    {
      "name": "lootVault",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "goldPending",
            "type": "u64"
          },
          {
            "name": "foodPending",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "padding",
            "type": {
              "array": [
                "u8",
                15
              ]
            }
          }
        ]
      }
    },
    {
      "name": "mineState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "index",
            "type": "u8"
          },
          {
            "name": "level",
            "type": "u8"
          },
          {
            "name": "lastCollectTs",
            "type": "i64"
          },
          {
            "name": "buffer",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "padding",
            "type": {
              "array": [
                "u8",
                13
              ]
            }
          }
        ]
      }
    },
    {
      "name": "playerMap",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "slotType",
            "type": {
              "array": [
                "u8",
                50
              ]
            }
          },
          {
            "name": "slotLevel",
            "type": {
              "array": [
                "u8",
                50
              ]
            }
          },
          {
            "name": "slotRow",
            "type": {
              "array": [
                "u8",
                50
              ]
            }
          },
          {
            "name": "slotCol",
            "type": {
              "array": [
                "u8",
                50
              ]
            }
          },
          {
            "name": "inBuildMode",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "padding",
            "type": {
              "array": [
                "u8",
                228
              ]
            }
          }
        ]
      }
    },
    {
      "name": "playerProfile",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "level",
            "type": "u8"
          },
          {
            "name": "xp",
            "type": "u32"
          },
          {
            "name": "builderCount",
            "type": "u8"
          },
          {
            "name": "tcLevel",
            "type": "u8"
          },
          {
            "name": "barracksLevel",
            "type": "u8"
          },
          {
            "name": "marketLevel",
            "type": "u8"
          },
          {
            "name": "popCap",
            "type": "u16"
          },
          {
            "name": "popUsed",
            "type": "u16"
          },
          {
            "name": "mapDelegated",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "padding",
            "type": {
              "array": [
                "u8",
                201
              ]
            }
          }
        ]
      }
    },
    {
      "name": "spellHand",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "counts",
            "type": {
              "array": [
                "u8",
                30
              ]
            }
          },
          {
            "name": "slotted",
            "type": {
              "array": [
                "u8",
                5
              ]
            }
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "padding",
            "type": {
              "array": [
                "u8",
                4
              ]
            }
          }
        ]
      }
    },
    {
      "name": "storageState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "level",
            "type": "u8"
          },
          {
            "name": "goldBalance",
            "type": "u64"
          },
          {
            "name": "foodBalance",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "padding",
            "type": {
              "array": [
                "u8",
                13
              ]
            }
          }
        ]
      }
    },
    {
      "name": "trainingAuth",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "nonce",
            "type": "u64"
          },
          {
            "name": "goldCost",
            "type": "u64"
          },
          {
            "name": "foodCost",
            "type": "u64"
          },
          {
            "name": "troopType",
            "type": "u8"
          },
          {
            "name": "quantity",
            "type": "u16"
          },
          {
            "name": "expiresTs",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "padding",
            "type": {
              "array": [
                "u8",
                28
              ]
            }
          }
        ]
      }
    },
    {
      "name": "troopBarracks",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "level",
            "type": "u8"
          },
          {
            "name": "counts",
            "type": {
              "array": [
                "u16",
                9
              ]
            }
          },
          {
            "name": "battleCounts",
            "type": {
              "array": [
                "u16",
                9
              ]
            }
          },
          {
            "name": "consumedAuths",
            "type": {
              "vec": "u64"
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "troopUpgrades",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "upgraded",
            "type": {
              "array": [
                "bool",
                9
              ]
            }
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "padding",
            "type": {
              "array": [
                "u8",
                22
              ]
            }
          }
        ]
      }
    }
  ]
};
