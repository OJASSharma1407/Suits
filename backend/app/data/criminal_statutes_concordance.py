"""Criminal Statutes Concordance Knowledge Base.

Authoritative bi-directional mappings across the Indian Criminal Law eras:
1. Legacy Codes: Indian Penal Code 1860 (IPC), Code of Criminal Procedure 1973 (CrPC), Indian Evidence Act 1872 (IEA)
2. New Codes: Bharatiya Nyaya Sanhita 2023 (BNS), Bharatiya Nagarik Suraksha Sanhita 2023 (BNSS), Bharatiya Sakshya Adhiniyam 2023 (BSA)

Enforced on 1 July 2024.
"""

from __future__ import annotations

from typing import Any

CRIMINAL_CONCORDANCE_DATA: list[dict[str, Any]] = [
    # -------------------------------------------------------------
    # CrPC ↔ BNSS (Procedural Framework)
    # -------------------------------------------------------------
    {
        "id": "crpc_41a_bnss_35_3",
        "old_code": "CrPC",
        "old_section": "41A",
        "old_title": "Notice of appearance before police officer",
        "new_code": "BNSS",
        "new_section": "35(3)",
        "new_title": "Notice of appearance before police officer",
        "category": "PROCEDURAL",
        "concept_doctrine": "Mandatory Notice of Appearance & Arrest Safeguards",
        "doctrine_summary": (
            "Police cannot mechanically arrest in offences punishable with up to 7 years imprisonment. "
            "Issuance of notice under Section 41A CrPC (now Section 35(3) BNSS) is mandatory unless recorded "
            "reasons satisfy Section 41(1)(b) CrPC (now Section 35(1)(b) BNSS)."
        ),
        "landmark_precedents": [
            {
                "title": "Arnesh Kumar v. State of Bihar",
                "citation": "(2014) 8 SCC 273",
                "court": "Supreme Court of India",
                "ratio": (
                    "No arrest should be made without reasonable satisfaction reached after some investigation as to "
                    "the genuineness of allegations. Notice under Section 41A CrPC must be served within 2 weeks of FIR. "
                    "Police officer and Magistrate face departmental action and contempt of court for mechanical arrest."
                ),
            },
            {
                "title": "Satender Kumar Antil v. CBI",
                "citation": "(2022) 10 SCC 51",
                "court": "Supreme Court of India",
                "ratio": (
                    "Non-compliance of Section 41 and 41A CrPC entitles the accused to bail without custodial detention. "
                    "Courts are mandated to strictly follow the guidelines regarding bail categories."
                ),
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 35(7) BNSS Prior Permission Proviso",
                "delta_type": "NEW_PROVISO_ADDED",
                "details": (
                    "Section 35(7) BNSS introduces a critical defense safeguard: for any cognizable offence "
                    "punishable with imprisonment for less than 3 years, no arrest shall be made of an infirm person "
                    "or person over 60 years of age without prior permission of an officer not below the rank of "
                    "Deputy Superintendent of Police (DSP)."
                ),
                "litigator_warning": (
                    "Check the age and health status of the accused. If accused is over 60 or infirm and offence is "
                    "< 3 years, failure by police to obtain prior DSP sanction renders arrest illegal ab initio."
                ),
            }
        ],
    },
    {
        "id": "crpc_154_bnss_173",
        "old_code": "CrPC",
        "old_section": "154",
        "old_title": "Information in cognizable cases",
        "new_code": "BNSS",
        "new_section": "173",
        "new_title": "Information in cognizable cases",
        "category": "PROCEDURAL",
        "concept_doctrine": "Mandatory Registration of FIR & Preliminary Inquiry Rules",
        "doctrine_summary": (
            "Registration of FIR is mandatory if the information discloses commission of a cognizable offence. "
            "No preliminary inquiry is permissible in such cases except within strictly circumscribed exceptions."
        ),
        "landmark_precedents": [
            {
                "title": "Lalita Kumari v. Govt. of U.P.",
                "citation": "(2014) 2 SCC 1",
                "court": "Supreme Court of India (Constitution Bench)",
                "ratio": (
                    "Registration of FIR is mandatory under Section 154 CrPC if information discloses a cognizable offence. "
                    "Preliminary inquiry is permissible only in exceptional categories (matrimonial, commercial, medical "
                    "negligence, corruption, or cases with abnormal delay) and must be completed within a strict timeframe."
                ),
            },
            {
                "title": "Youth Bar Association of India v. Union of India",
                "citation": "(2016) 9 SCC 473",
                "court": "Supreme Court of India",
                "ratio": (
                    "FIRs must be uploaded on the police or government portal within 24 hours (48-72 hours in exceptional "
                    "cases) to preserve the accused's constitutional right to seek pre-arrest legal remedies."
                ),
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 173(3) BNSS Statutory Preliminary Inquiry",
                "delta_type": "SUBSTANTIAL_CHANGE",
                "details": (
                    "Section 173(3) BNSS legislatively enacts a preliminary inquiry mechanism: for offences punishable "
                    "with imprisonment for 3 years or more but less than 7 years, the Officer-in-Charge of the police "
                    "station may, with prior permission of an officer not below the rank of DSP, conduct a preliminary "
                    "inquiry within a period of 14 days to ascertain whether a prima facie case exists."
                ),
                "litigator_warning": (
                    "Inquiry exceeding 14 days without FIR registration violates Section 173(3) BNSS. Litigators can "
                    "invoke Lalita Kumari guidelines alongside Section 173(3) to petition High Courts under Section 528 BNSS "
                    "for illegal pre-FIR harassment or arbitrary delay."
                ),
            },
            {
                "provision_name": "Section 173(1) BNSS e-FIR Signature Proviso",
                "delta_type": "PROCEDURE_MODIFIED",
                "details": (
                    "Electronic information (e-FIR) can be given, but must be taken on record and signed by the "
                    "complainant within 3 days before it is formally registered as an FIR."
                ),
                "litigator_warning": (
                    "If prosecution relies on an unsigned electronic communication without compliance with the 3-day signature "
                    "mandate, its status as a valid FIR under Section 173(1) is legally vulnerable."
                ),
            },
        ],
    },
    {
        "id": "crpc_100_165_bnss_105",
        "old_code": "CrPC",
        "old_section": "100 / 165",
        "old_title": "Search and seizure in presence of independent witnesses",
        "new_code": "BNSS",
        "new_section": "105",
        "new_title": "Recording of search and seizure through audio-video electronic means",
        "category": "PROCEDURAL",
        "concept_doctrine": "Search & Seizure Integrity & Mandatory Videography",
        "doctrine_summary": (
            "Search and seizure must strictly adhere to statutory safeguards to prevent planting of evidence and "
            "fabricated recovery memos."
        ),
        "landmark_precedents": [
            {
                "title": "State of Punjab v. Baldev Singh",
                "citation": "(1999) 6 SCC 172",
                "court": "Supreme Court of India (Constitution Bench)",
                "ratio": (
                    "Failure to adhere to mandatory statutory search safeguards prejudices the accused, vitiates the "
                    "recovery, and renders the trial unfair under Article 21."
                ),
            },
            {
                "title": "Shafhi Mohammad v. State of H.P.",
                "citation": "(2018) 5 SCC 311",
                "court": "Supreme Court of India",
                "ratio": (
                    "Use of videography during crime scene inspection, search, and seizure is an essential safeguard to "
                    "lend credibility to police investigations and curb false implication."
                ),
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 105 BNSS Mandatory Audio-Video Recording",
                "delta_type": "SUBSTANTIAL_CHANGE",
                "details": (
                    "Section 105 BNSS mandates that the process of conducting search of a place or taking possession of "
                    "any property, article, or thing, including preparation of the seizure list and signing by witnesses, "
                    "shall be recorded through audio-video electronic means, preferably by mobile phone, and forwarded "
                    "without delay to the District Magistrate, Sub-divisional Magistrate, or Judicial Magistrate."
                ),
                "litigator_warning": (
                    "Any physical seizure or recovery conducted after 1 July 2024 lacking contemporaneous unedited "
                    "videography and cryptographic certificate violates Section 105 BNSS. Move for exclusion of "
                    "unrecorded recovery memos at the stage of bail and discharge."
                ),
            }
        ],
    },
    {
        "id": "crpc_161_bnss_180",
        "old_code": "CrPC",
        "old_section": "161",
        "old_title": "Examination of witnesses by police",
        "new_code": "BNSS",
        "new_section": "180",
        "new_title": "Examination of witnesses by police",
        "category": "PROCEDURAL",
        "concept_doctrine": "Police Witness Statements & Audio-Video Recording",
        "doctrine_summary": (
            "Statements given to police during investigation cannot be signed and can only be used for contradiction "
            "under Section 145 IEA / Section 148 BSA."
        ),
        "landmark_precedents": [
            {
                "title": "Nandini Satpathy v. P.L. Dani",
                "citation": "(1978) 2 SCC 424",
                "court": "Supreme Court of India",
                "ratio": (
                    "Right against self-incrimination under Article 20(3) extends to police interrogation under Section 161 CrPC. "
                    "An accused has the right to remain silent when questions have a tendency to expose them to a criminal charge."
                ),
            },
            {
                "title": "Tahsildar Singh v. State of U.P.",
                "citation": "AIR 1959 SC 1012",
                "court": "Supreme Court of India",
                "ratio": (
                    "Statements under Section 161 CrPC cannot be used as substantive evidence; their sole purpose is "
                    "contradiction of prosecution witnesses under Section 145 Evidence Act."
                ),
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 180(3) BNSS Electronic Examination Proviso",
                "delta_type": "PROCEDURE_MODIFIED",
                "details": (
                    "Section 180(3) BNSS provides that statement of a witness may also be recorded by audio-video "
                    "electronic means."
                ),
                "litigator_warning": (
                    "Ensure electronic witness recordings are inspected for redactions, cuts, or off-camera police coaching."
                ),
            }
        ],
    },
    {
        "id": "crpc_164_bnss_183",
        "old_code": "CrPC",
        "old_section": "164",
        "old_title": "Recording of confessions and statements by Magistrate",
        "new_code": "BNSS",
        "new_section": "183",
        "new_title": "Recording of confessions and statements by Magistrate",
        "category": "PROCEDURAL",
        "concept_doctrine": "Judicial Confessions & Victim Statements",
        "doctrine_summary": (
            "Magistrate must ensure confession is voluntary, administer statutory warning, and provide reflection time. "
            "Victim statements in sexual offences must be recorded promptly."
        ),
        "landmark_precedents": [
            {
                "title": "Rabindra Kumar Pal v. Republic of India",
                "citation": "(2011) 2 SCC 490",
                "court": "Supreme Court of India",
                "ratio": (
                    "Confession recorded under Section 164 CrPC without strict adherence to voluntary warnings and adequate "
                    "cooling-off period in judicial custody is inadmissible and cannot sustain a conviction."
                ),
            }
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 183(1) BNSS Audio-Video Recording",
                "delta_type": "PROCEDURE_MODIFIED",
                "details": (
                    "Statements and confessions may be recorded by audio-video electronic means in presence of the advocate "
                    "for the person accused."
                ),
                "litigator_warning": (
                    "Section 183(6)(a) BNSS makes recording of victim statement mandatory as soon as information of sexual "
                    "offence is received by police."
                ),
            }
        ],
    },
    {
        "id": "crpc_167_2_bnss_187",
        "old_code": "CrPC",
        "old_section": "167(2)",
        "old_title": "Remand procedure, police custody & default bail",
        "new_code": "BNSS",
        "new_section": "187",
        "new_title": "Procedure when investigation cannot be completed in twenty-four hours",
        "category": "PROCEDURAL",
        "concept_doctrine": "Police Custody Windows & Indefeasible Default Bail",
        "doctrine_summary": (
            "Strict statutory ceiling on police custody and indefeasible constitutional right to default bail upon expiry "
            "of the statutory investigation period (60/90 days)."
        ),
        "landmark_precedents": [
            {
                "title": "Bikramjit Singh v. State of Punjab",
                "citation": "(2020) 10 SCC 616",
                "court": "Supreme Court of India",
                "ratio": (
                    "Default bail under Section 167(2) CrPC is a fundamental right rooted in Article 21, not a mere statutory "
                    "privilege. Once the statutory period expires and an application is filed, the right cannot be defeated."
                ),
            },
            {
                "title": "CBI v. Anupam J. Kulkarni",
                "citation": "(1992) 3 SCC 141",
                "court": "Supreme Court of India",
                "ratio": (
                    "Police custody cannot be granted after the expiry of the first 15 days of initial remand from the date "
                    "of production before the Magistrate."
                ),
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 187(2) & 187(3) BNSS Police Custody Intermittent Authorization",
                "delta_type": "SUBSTANTIAL_CHANGE",
                "details": (
                    "Section 187(2) BNSS permits the Magistrate to authorize police custody 'in whole or in parts, at any time "
                    "during the initial 40 days or 60 days' out of the total detention period of 60 or 90 days. This substantially "
                    "overrides the rigid 15-day initial window restriction laid down in CBI v. Anupam J. Kulkarni."
                ),
                "litigator_warning": (
                    "Police may apply for subsequent police remand even weeks after judicial custody. Litigators must contest "
                    "any second police remand on grounds of lack of fresh discovery materials, threat of custodial coercion, "
                    "and violation of Article 21 protections."
                ),
            }
        ],
    },
    {
        "id": "crpc_436a_bnss_479",
        "old_code": "CrPC",
        "old_section": "436A",
        "old_title": "Maximum period for which undertrial prisoner can be detained",
        "new_code": "BNSS",
        "new_section": "479",
        "new_title": "Maximum period for which an undertrial prisoner can be detained",
        "category": "PROCEDURAL",
        "concept_doctrine": "Speedy Trial & Undertrial Detention Relief",
        "doctrine_summary": (
            "Undertrial prisoners who have served a substantial portion of the maximum sentence are entitled to mandatory release."
        ),
        "landmark_precedents": [
            {
                "title": "Hussainara Khatoon v. Home Secretary, State of Bihar",
                "citation": "(1980) 1 SCC 81",
                "court": "Supreme Court of India",
                "ratio": (
                    "Right to speedy trial is an integral part of the fundamental right to life and liberty enshrined in Article 21. "
                    "Undertrials languishing in prison longer than their potential sentence must be freed immediately."
                ),
            }
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 479(1) BNSS First-Time Offender 1/3rd Sentence Release",
                "delta_type": "SUBSTANTIAL_CHANGE",
                "details": (
                    "Section 479 BNSS introduces a groundbreaking pro-defense mandate: where a person is a first-time offender "
                    "(never convicted of any offence in the past), he SHALL be released on bond by the court if he has undergone "
                    "detention for 1/3rd of the maximum period of imprisonment specified for that offence (compared to 1/2 under 436A CrPC)."
                ),
                "litigator_warning": (
                    "Immediately file an application under Section 479 BNSS if your client is a first-time undertrial who has completed "
                    "one-third of the maximum sentence. Courts are statutorily obliged to release on personal bond."
                ),
            }
        ],
    },
    {
        "id": "crpc_438_bnss_482",
        "old_code": "CrPC",
        "old_section": "438",
        "old_title": "Direction for grant of bail to person apprehending arrest (Anticipatory Bail)",
        "new_code": "BNSS",
        "new_section": "482",
        "new_title": "Direction for grant of bail to person apprehending arrest",
        "category": "PROCEDURAL",
        "concept_doctrine": "Anticipatory Bail & Pre-Arrest Liberty",
        "doctrine_summary": (
            "Section 438 CrPC (now Section 482 BNSS) protects personal liberty under Article 21 against motivated, "
            "politically induced, or mala fide arrests."
        ),
        "landmark_precedents": [
            {
                "title": "Gurbaksh Singh Sibbia v. State of Punjab",
                "citation": "(1980) 2 SCC 565",
                "court": "Supreme Court of India (Constitution Bench)",
                "ratio": (
                    "Anticipatory bail should not be circumscribed by unwarranted statutory restrictions not found in the code. "
                    "Personal liberty under Article 21 requires expansive judicial discretion to prevent harassment."
                ),
            },
            {
                "title": "Sushila Aggarwal v. State (NCT of Delhi)",
                "citation": "(2020) 5 SCC 1",
                "court": "Supreme Court of India (Constitution Bench)",
                "ratio": (
                    "Anticipatory bail orders need not be limited to a fixed duration or till the filing of chargesheet. "
                    "Pre-arrest protection ordinarily continues until the conclusion of the trial unless exceptional circumstances justify recall."
                ),
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 482 BNSS Direct Substitution",
                "delta_type": "DIRECT_SUBSTITUTION",
                "details": (
                    "Section 482 BNSS directly replaces Section 438 CrPC with identical core jurisprudence. "
                    "Under Section 8 of the General Clauses Act, 1897, all Constitution Bench precedents (Sibbia, Sushila Aggarwal) "
                    "apply mutatis mutandis to Section 482 BNSS."
                ),
                "litigator_warning": (
                    "Never cite Section 438 CrPC alone in petitions filed post-1 July 2024. Always style the petition as "
                    "'Under Section 482 BNSS read with Section 438 CrPC' to prevent registry defects."
                ),
            }
        ],
    },
    {
        "id": "crpc_439_bnss_483",
        "old_code": "CrPC",
        "old_section": "439",
        "old_title": "Special powers of High Court or Court of Session regarding bail",
        "new_code": "BNSS",
        "new_section": "483",
        "new_title": "Special powers of High Court or Court of Session regarding bail",
        "category": "PROCEDURAL",
        "concept_doctrine": "Regular Bail, Parity & Incarceration Balancing",
        "doctrine_summary": (
            "Bail is the rule and jail is the exception. Gravity of offence must be balanced with duration of incarceration, "
            "delay in trial, and parity with co-accused."
        ),
        "landmark_precedents": [
            {
                "title": "State of Rajasthan v. Balchand",
                "citation": "(1977) 4 SCC 308",
                "court": "Supreme Court of India",
                "ratio": "The basic rule of our criminal justice system is bail, not jail, except where there are circumstances suggestive of fleeing justice or tampering with evidence.",
            },
            {
                "title": "Satender Kumar Antil v. CBI",
                "citation": "(2022) 10 SCC 51",
                "court": "Supreme Court of India",
                "ratio": "Bail applications must be decided within 2 weeks and anticipatory bail within 6 weeks. Prolonged incarceration without trial violates Article 21.",
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 483 BNSS Public Prosecutor Notice Mandate",
                "delta_type": "PROCEDURE_MODIFIED",
                "details": (
                    "Notice to Public Prosecutor is mandatory before granting bail in offences punishable with 7 years or more "
                    "or life imprisonment."
                ),
                "litigator_warning": (
                    "Ensure advance notice copy is served upon the Public Prosecutor/State Standing Counsel to prevent adjournment on initial listing."
                ),
            }
        ],
    },
    {
        "id": "crpc_482_bnss_528",
        "old_code": "CrPC",
        "old_section": "482",
        "old_title": "Saving of inherent powers of High Court",
        "new_code": "BNSS",
        "new_section": "528",
        "new_title": "Saving of inherent powers of High Court",
        "category": "PROCEDURAL",
        "concept_doctrine": "Inherent Powers of High Court & FIR Quashing",
        "doctrine_summary": (
            "High Court possesses ex debito justitiae inherent powers to prevent abuse of the process of any court and "
            "to secure the ends of justice, including quashing malicious FIRs and civil disputes disguised as criminal cases."
        ),
        "landmark_precedents": [
            {
                "title": "State of Haryana v. Bhajan Lal",
                "citation": "1992 Supp (1) SCC 335",
                "court": "Supreme Court of India",
                "ratio": (
                    "Laid down the celebrated 7 illustrative categories where the High Court can quash criminal proceedings, "
                    "including where allegations in FIR do not disclose a cognizable offence, where allegations are manifestly "
                    "malicious, or where there is an express legal bar."
                ),
            },
            {
                "title": "Neeharika Infrastructure Pvt. Ltd. v. State of Maharashtra",
                "citation": "(2021) 19 SCC 401",
                "court": "Supreme Court of India",
                "ratio": (
                    "High Courts should exercise inherent powers under Section 482 sparingly with circumspection, but must "
                    "intervene where continuation of proceedings amounts to gross abuse of process."
                ),
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 528 BNSS Verbatim Continuation",
                "delta_type": "DIRECT_SUBSTITUTION",
                "details": (
                    "Section 528 BNSS is a verbatim statutory reproduction of Section 482 CrPC. "
                    "All 30+ years of Bhajan Lal jurisprudence apply with full constitutional force to Section 528 BNSS petitions."
                ),
                "litigator_warning": (
                    "Petitions seeking quashing of FIRs registered on or after 1 July 2024 must be filed under Section 528 BNSS. "
                    "Grounds should expressly invoke Bhajan Lal categories 1, 3, and 7."
                ),
            }
        ],
    },
    {
        "id": "crpc_176_1a_bnss_196",
        "old_code": "CrPC",
        "old_section": "176(1A)",
        "old_title": "Inquiry by Magistrate into cause of death in custody",
        "new_code": "BNSS",
        "new_section": "196",
        "new_title": "Inquiry by Magistrate into cause of death",
        "category": "PROCEDURAL",
        "concept_doctrine": "Custodial Torture & Custodial Death Safeguards",
        "doctrine_summary": (
            "Mandatory judicial magistrate inquiry into any case of death, disappearance, or rape alleged to have been "
            "committed in police custody, independent of executive police reports."
        ),
        "landmark_precedents": [
            {
                "title": "D.K. Basu v. State of West Bengal",
                "citation": "(1997) 1 SCC 416",
                "court": "Supreme Court of India",
                "ratio": (
                    "Custodial violence, torture, and custodial deaths are serious blows to human dignity and Article 21. "
                    "Laid down 11 mandatory guidelines for arrest, inspection memo, interrogation, medical checkup, and intimation to relatives."
                ),
            },
            {
                "title": "Sube Singh v. State of Haryana",
                "citation": "(2006) 3 SCC 178",
                "court": "Supreme Court of India",
                "ratio": (
                    "Compensation under public law for custodial torture is an acknowledged remedy for breach of fundamental "
                    "rights guaranteed under Article 21."
                ),
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 196(4) & (5) BNSS Videographed Autopsy & Strict Deadlines",
                "delta_type": "SUBSTANTIAL_CHANGE",
                "details": (
                    "Section 196(4) & (5) BNSS mandates that post-mortem examination in custodial death cases shall be conducted "
                    "by a civil surgeon or medical board with audio-video recording, and autopsy records sent to the Magistrate within 24 hours."
                ),
                "litigator_warning": (
                    "In allegations of custodial assault or suspicious death, immediately seek preservation of audio-video autopsy "
                    "recordings and CCTV footage under Section 196 BNSS."
                ),
            }
        ],
    },

    # -------------------------------------------------------------
    # IPC ↔ BNS (Substantive Offences)
    # -------------------------------------------------------------
    {
        "id": "ipc_302_bns_103",
        "old_code": "IPC",
        "old_section": "302",
        "old_title": "Punishment for murder",
        "new_code": "BNS",
        "new_section": "103(1)",
        "new_title": "Punishment for murder",
        "category": "SUBSTANTIVE",
        "concept_doctrine": "Homicide, Intentional Killing & Murder Proof",
        "doctrine_summary": (
            "Proving murder requires establishing intention to cause death or bodily injury sufficient in the ordinary "
            "course of nature to cause death."
        ),
        "landmark_precedents": [
            {
                "title": "Virsa Singh v. State of Punjab",
                "citation": "AIR 1958 SC 465",
                "court": "Supreme Court of India",
                "ratio": (
                    "To bring culpable homicide under Section 300 Clause 3, the prosecution must prove objective physical "
                    "injury and subjective intention to inflict that particular injury, which is sufficient in ordinary course to cause death."
                ),
            }
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 103(2) BNS Mob Lynching Clause",
                "delta_type": "NEW_PROVISO_ADDED",
                "details": (
                    "Section 103(2) BNS introduces a distinct offense when murder is committed by a group of five or more persons "
                    "acting in concert on grounds of race, caste, community, sex, place of birth, language, or personal belief, "
                    "punishable with death or life imprisonment."
                ),
                "litigator_warning": (
                    "For mob violence or group clashes, verify whether prosecution invoked Section 103(2) BNS or Section 103(1) BNS."
                ),
            }
        ],
    },
    {
        "id": "ipc_304b_bns_80",
        "old_code": "IPC",
        "old_section": "304B",
        "old_title": "Dowry death",
        "new_code": "BNS",
        "new_section": "80",
        "new_title": "Dowry death",
        "category": "SUBSTANTIVE",
        "concept_doctrine": "Dowry Death & Proximate Cruelty",
        "doctrine_summary": (
            "Death within 7 years of marriage under unnatural circumstances where woman was subjected to cruelty or "
            "harassment by husband or his relatives soon before death in connection with dowry demands."
        ),
        "landmark_precedents": [
            {
                "title": "Satbir Singh v. State of Haryana",
                "citation": "(2021) 6 SCC 1",
                "court": "Supreme Court of India",
                "ratio": (
                    "The phrase 'soon before death' in Section 304B IPC does not mean immediately prior, but establishes a proximate "
                    "and live link between the cruelty and the unnatural death. Section 313 CrPC examination must confront the accused with all incriminating facts."
                ),
            }
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 80 BNS Direct Transposition",
                "delta_type": "DIRECT_SUBSTITUTION",
                "details": "Section 80 BNS mirrors Section 304B IPC with identical minimum punishment of 7 years up to life imprisonment.",
                "litigator_warning": "Read alongside Section 118 BSA (presumption as to dowry death, replacing Section 113B IEA).",
            }
        ],
    },
    {
        "id": "ipc_420_bns_318_4",
        "old_code": "IPC",
        "old_section": "420",
        "old_title": "Cheating and dishonestly inducing delivery of property",
        "new_code": "BNS",
        "new_section": "318(4)",
        "new_title": "Cheating and dishonestly inducing delivery of property",
        "category": "SUBSTANTIVE",
        "concept_doctrine": "Cheating vs Civil Breach of Contract",
        "doctrine_summary": (
            "Dishonest or fraudulent intention must exist at the inception of the transaction. A mere subsequent failure "
            "to fulfill a promise or commercial contract does not constitute the criminal offence of cheating."
        ),
        "landmark_precedents": [
            {
                "title": "Hridaya Ranjan Prasad Verma v. State of Bihar",
                "citation": "(2000) 4 SCC 168",
                "court": "Supreme Court of India",
                "ratio": (
                    "Distinction between mere breach of contract and cheating depends upon the intention of the accused at the time "
                    "of inducement. Subsequent breach cannot generate criminal culpability without fraudulent intent at inception."
                ),
            },
            {
                "title": "Prof. R.K. Vijayasarathy v. Sudha Seetharam",
                "citation": "(2019) 16 SCC 739",
                "court": "Supreme Court of India",
                "ratio": (
                    "Criminal proceedings cannot be used as an instrument of oppression or arm-twisting to recover commercial "
                    "debts; such FIRs under Section 420 IPC are liable to be quashed under Section 482 CrPC."
                ),
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 318(4) BNS Reclassification",
                "delta_type": "DIRECT_SUBSTITUTION",
                "details": (
                    "Section 318(4) BNS penalizes cheating with property delivery up to 7 years and fine. "
                    "All settled jurisprudence on civil dispute quashing applies fully under Section 318(4) BNS."
                ),
                "litigator_warning": (
                    "In quashing petitions under Section 528 BNSS against Section 318(4) BNS FIRs, cite Hridaya Ranjan and Vijayasarathy "
                    "to demonstrate that commercial disputes cannot be converted into criminal prosecution."
                ),
            }
        ],
    },
    {
        "id": "ipc_406_bns_316",
        "old_code": "IPC",
        "old_section": "406",
        "old_title": "Punishment for criminal breach of trust",
        "new_code": "BNS",
        "new_section": "316",
        "new_title": "Criminal breach of trust",
        "category": "SUBSTANTIVE",
        "concept_doctrine": "Entrustment & Misappropriation",
        "doctrine_summary": (
            "Entrustment of property and subsequent dishonest misappropriation or conversion to accused's own use."
        ),
        "landmark_precedents": [
            {
                "title": "Rashmi Kumar v. Mahesh Kumar Bhada",
                "citation": "(1997) 2 SCC 397",
                "court": "Supreme Court of India",
                "ratio": "Stridhan is the absolute property of woman; failure of husband or in-laws to return it on demand constitutes criminal breach of trust.",
            }
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 316 BNS Consolidation",
                "delta_type": "DIRECT_SUBSTITUTION",
                "details": "Section 316 defines and penalizes criminal breach of trust (punishment under Section 316(2) up to 3 years or fine).",
                "litigator_warning": "Direct substitution; cite Section 316(2) BNS in modern chargesheets.",
            }
        ],
    },
    {
        "id": "ipc_376_bns_64_69",
        "old_code": "IPC",
        "old_section": "376",
        "old_title": "Punishment for rape",
        "new_code": "BNS",
        "new_section": "64 / 69",
        "new_title": "Punishment for rape & sexual intercourse by deceitful means",
        "category": "SUBSTANTIVE",
        "concept_doctrine": "Sexual Offences & Consent Under False Promise of Marriage",
        "doctrine_summary": (
            "Distinction between false promise of marriage given with deceitful intent from inception vs breach of promise "
            "arising out of subsequent incompatibility."
        ),
        "landmark_precedents": [
            {
                "title": "Pramod Suryabhan Pawar v. State of Maharashtra",
                "citation": "(2019) 9 SCC 608",
                "court": "Supreme Court of India",
                "ratio": (
                    "To constitute misconception of fact under Section 90 IPC vitiating consent, promise of marriage must have "
                    "been false at the inception. A breach of promise arising from genuine inability does not amount to rape."
                ),
            }
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 69 BNS Separate Offence for Deceitful Promise of Marriage",
                "delta_type": "SUBSTANTIAL_CHANGE",
                "details": (
                    "Section 69 BNS creates a specific, distinct offense for having sexual intercourse by employing deceitful "
                    "means or false promise of marriage, punishable with imprisonment up to 10 years, decoupling it from the "
                    "traditional rape definition in Section 64 BNS."
                ),
                "litigator_warning": (
                    "Check whether FIR alleges rape under Section 64 BNS or deceitful relationship under Section 69 BNS. "
                    "If allegations fall under Section 69 BNS, invoke Pramod Pawar ratio to challenge 'deceit at inception'."
                ),
            }
        ],
    },
    {
        "id": "ipc_498a_bns_85_86",
        "old_code": "IPC",
        "old_section": "498A",
        "old_title": "Husband or relative of husband of a woman subjecting her to cruelty",
        "new_code": "BNS",
        "new_section": "85 / 86",
        "new_title": "Cruelty by husband or relatives of husband",
        "category": "SUBSTANTIVE",
        "concept_doctrine": "Matrimonial Cruelty & Prevention of Omnibus Accusations",
        "doctrine_summary": (
            "Protection against matrimonial harassment while preventing mechanical implication of distant in-laws without "
            "specific attributable overt acts."
        ),
        "landmark_precedents": [
            {
                "title": "Preeti Gupta v. State of Jharkhand",
                "citation": "(2010) 7 SCC 667",
                "court": "Supreme Court of India",
                "ratio": (
                    "Supreme Court expressed concern over rampant misuse of Section 498A IPC by implicating all family members "
                    "and relatives without specific allegations. Criminal courts must scrutinize allegations with caution."
                ),
            },
            {
                "title": "Kahkashan Kausar v. State of Bihar",
                "citation": "(2022) 6 SCC 599",
                "court": "Supreme Court of India",
                "ratio": (
                    "General and omnibus allegations against in-laws without specific overt acts cannot be sustained in law; "
                    "such proceedings are liable to be quashed under Section 482 CrPC."
                ),
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 85 & 86 BNS Separation of Offence & Definition",
                "delta_type": "DIRECT_SUBSTITUTION",
                "details": (
                    "Section 85 BNS penalizes cruelty with imprisonment up to 3 years and fine, while Section 86 BNS sets out "
                    "the statutory definition of 'cruelty' (wilful conduct likely to drive to suicide or harassment for dowry)."
                ),
                "litigator_warning": (
                    "Apply Kahkashan Kausar to seek immediate discharge or quashing under Section 528 BNSS for distant in-laws "
                    "named omnibus in Section 85 BNS complaints."
                ),
            }
        ],
    },
    {
        "id": "ipc_124a_bns_152",
        "old_code": "IPC",
        "old_section": "124A",
        "old_title": "Sedition",
        "new_code": "BNS",
        "new_section": "152",
        "new_title": "Act endangering sovereignty, unity and integrity of India",
        "category": "SUBSTANTIVE",
        "concept_doctrine": "Free Speech, National Security & Sovereignty Offence",
        "doctrine_summary": (
            "Colonial offence of sedition replaced with acts endangering sovereignty and unity; speech without incitement "
            "to violence remains constitutionally protected."
        ),
        "landmark_precedents": [
            {
                "title": "Kedar Nath Singh v. State of Bihar",
                "citation": "1962 Supp (2) SCR 769",
                "court": "Supreme Court of India (Constitution Bench)",
                "ratio": (
                    "Criticism of public measures or government policy, however strong or pungent, does not constitute an "
                    "offence unless it is accompanied by incitement to public disorder or violence."
                ),
            },
            {
                "title": "S.G. Vombatkere v. Union of India",
                "citation": "(2022) 7 SCC 433",
                "court": "Supreme Court of India",
                "ratio": "All pending trials, appeals, and proceedings with respect to Section 124A IPC were ordered to be kept in abeyance.",
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 152 BNS Overhaul",
                "delta_type": "SUBSTANTIAL_CHANGE",
                "details": (
                    "The word 'sedition' is omitted. Section 152 BNS penalizes purposefully exciting or attempting to excite "
                    "secession or armed rebellion or subversive activities, or endangering sovereignty, unity, and integrity of India, "
                    "with imprisonment for 7 years up to life imprisonment."
                ),
                "litigator_warning": (
                    "Kedar Nath Singh ratio continues to apply: unless words or acts incite violence or armed insurrection, "
                    "democratic criticism of state policy cannot be brought under Section 152 BNS."
                ),
            }
        ],
    },

    # -------------------------------------------------------------
    # IEA ↔ BSA (Evidentiary Principles)
    # -------------------------------------------------------------
    {
        "id": "iea_27_bsa_23_2",
        "old_code": "IEA",
        "old_section": "27",
        "old_title": "How much of information received from accused may be proved (Recovery of Fact)",
        "new_code": "BSA",
        "new_section": "23(2)",
        "new_title": "Information received from accused leading to discovery of fact",
        "category": "EVIDENTIARY",
        "concept_doctrine": "Disclosure Statements & Recovery of Facts in Police Custody",
        "doctrine_summary": (
            "Only that distinct portion of the disclosure statement that relates directly to the fact discovered thereby "
            "is admissible in evidence; confessions of guilt remain inadmissible."
        ),
        "landmark_precedents": [
            {
                "title": "Pulukuri Kottaya v. King-Emperor",
                "citation": "AIR 1947 PC 67",
                "court": "Privy Council",
                "ratio": (
                    "The condition necessary to bring Section 27 into operation is that the discovery of a fact must be "
                    "deposed to, and only so much of the information as relates distinctly to the fact thereby discovered is admissible. "
                    "Statements like 'I will show the place where I stabbed deceased' are inadmissible except the place of discovery."
                ),
            },
            {
                "title": "Boby v. State of Kerala",
                "citation": "2023 SCC OnLine SC 50",
                "court": "Supreme Court of India",
                "ratio": (
                    "Recovery of weapons or articles from an open, accessible place without independent witness corroboration "
                    "does not satisfy Section 27 IEA."
                ),
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 23(2) BSA Read with Section 105 BNSS Videography",
                "delta_type": "PROCEDURE_MODIFIED",
                "details": (
                    "Section 23(2) BSA replicates the recovery proviso. However, it must now be strictly read with "
                    "Section 105 BNSS, which mandates audio-video electronic recording of all searches and seizures."
                ),
                "litigator_warning": (
                    "If the physical recovery under Section 23(2) BSA is not recorded through audio-video electronic means "
                    "under Section 105 BNSS, challenge the authenticity of the discovery memo and seek its total exclusion."
                ),
            }
        ],
    },
    {
        "id": "iea_65b_bsa_63",
        "old_code": "IEA",
        "old_section": "65B",
        "old_title": "Admissibility of electronic records",
        "new_code": "BSA",
        "new_section": "63",
        "new_title": "Admissibility of electronic records",
        "category": "EVIDENTIARY",
        "concept_doctrine": "Electronic Evidence & Mandatory Hash Certification",
        "doctrine_summary": (
            "Electronic evidence (CCTV footage, WhatsApp chats, call detail records, hard disks) requires statutory "
            "certification as condition precedent to admissibility."
        ),
        "landmark_precedents": [
            {
                "title": "Arjun Khotkar v. Kailash Kushwaha Gorantyal",
                "citation": "(2020) 7 SCC 1",
                "court": "Supreme Court of India (3-Judge Bench)",
                "ratio": (
                    "Section 65B(4) certificate is mandatory condition precedent to the admissibility of secondary electronic "
                    "evidence. Oral evidence in place of certificate is strictly barred."
                ),
            },
            {
                "title": "Anvar P.V. v. P.K. Basheer",
                "citation": "(2014) 10 SCC 473",
                "court": "Supreme Court of India",
                "ratio": (
                    "Special law overrules general law: electronic records can only be proved in accordance with Section 65B, "
                    "and general provisions for secondary evidence (Sections 63 and 65 IEA) are inapplicable."
                ),
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 63 BSA & Schedule Certificate with Hash Validation",
                "delta_type": "SUBSTANTIAL_CHANGE",
                "details": (
                    "Section 63 BSA completely revamps electronic admissibility: electronic records explicitly include "
                    "semiconductor memory, cloud storage, smartphones, and communication devices. A certificate under Part A "
                    "and Part B of the Schedule to the BSA is mandated, requiring hash value verification, device description, "
                    "and declaration of lawful custody."
                ),
                "litigator_warning": (
                    "Demand inspection of the cryptographic hash value (SHA-256 / MD5) mentioned in the BSA Schedule certificate. "
                    "Any mismatch between hash of raw source device and produced drive is fatal to prosecution evidence."
                ),
            }
        ],
    },
    {
        "id": "iea_circumstantial_bsa_panchsheel",
        "old_code": "IEA",
        "old_section": "3 / 101-104",
        "old_title": "Definition of proved & Burden of proof",
        "new_code": "BSA",
        "new_section": "2(1) / 104-107",
        "new_title": "Interpretation clause & Burden of proof",
        "category": "EVIDENTIARY",
        "concept_doctrine": "Circumstantial Evidence & Five Golden Principles (Panchsheel)",
        "doctrine_summary": (
            "In circumstantial cases, the prosecution must establish an unbroken chain of circumstances incapable of "
            "explanation on any reasonable hypothesis consistent with the innocence of the accused."
        ),
        "landmark_precedents": [
            {
                "title": "Sharad Birdhichand Sarda v. State of Maharashtra",
                "citation": "(1984) 4 SCC 116",
                "court": "Supreme Court of India",
                "ratio": (
                    "Laid down the 'Panchsheel' five golden principles of circumstantial evidence: (1) Circumstances must be "
                    "fully established; (2) Facts must be consistent only with the hypothesis of guilt; (3) Circumstances must be of "
                    "a conclusive nature; (4) Must exclude every possible hypothesis except guilt; (5) Chain must be so complete "
                    "as not to leave any reasonable ground for conclusion of innocence."
                ),
            },
            {
                "title": "Hanumant Govind Nargundkar v. State of M.P.",
                "citation": "AIR 1952 SC 343",
                "court": "Supreme Court of India",
                "ratio": (
                    "Circumstances from which the conclusion of guilt is to be drawn should in the first instance be fully "
                    "established, and all facts so established should be consistent only with the hypothesis of guilt."
                ),
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 2(1) & 104 BSA Continuity",
                "delta_type": "DIRECT_SUBSTITUTION",
                "details": (
                    "The definitions of 'proved', 'disproved', and 'not proved' in Section 2(1) BSA and burden of proof in "
                    "Section 104 BSA maintain the identical jurisprudential standard. Sharad Birdhichand Sarda principles "
                    "govern all circumstantial prosecutions under BSA."
                ),
                "litigator_warning": (
                    "Where prosecution relies on CDR, tower location, or CCTV circumstantial link, cross-reference with "
                    "Section 63 BSA certificate compliance. Break any link in the chain to secure acquittal."
                ),
            }
        ],
    },
    {
        "id": "iea_32_1_bsa_26_1",
        "old_code": "IEA",
        "old_section": "32(1)",
        "old_title": "Cases in which statement of relevant fact by person who is dead is relevant (Dying Declaration)",
        "new_code": "BSA",
        "new_section": "26(1)",
        "new_title": "Statements by persons who cannot be called as witnesses",
        "category": "EVIDENTIARY",
        "concept_doctrine": "Dying Declaration & Medical Fitness",
        "doctrine_summary": (
            "Dying declaration must be voluntary, truthful, and recorded when the declarant was in a fit mental condition."
        ),
        "landmark_precedents": [
            {
                "title": "Laxman v. State of Maharashtra",
                "citation": "(2002) 6 SCC 710",
                "court": "Supreme Court of India (Constitution Bench)",
                "ratio": (
                    "Medical certificate of fitness is a rule of caution, but if magistrate or person recording is satisfied "
                    "that declarant was in a fit mental state, declaration can be acted upon. Multiple inconsistent declarations "
                    "preclude conviction."
                ),
            },
            {
                "title": "Purshottam Chopra v. State (NCT of Delhi)",
                "citation": "(2020) 11 SCC 489",
                "court": "Supreme Court of India",
                "ratio": (
                    "A dying declaration can form the sole basis of conviction if it inspires full confidence. If there are "
                    "suspicious circumstances or prompting, corroboration is indispensable."
                ),
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 26(1) BSA Direct Transposition",
                "delta_type": "DIRECT_SUBSTITUTION",
                "details": "Section 26(1) BSA directly replicates Section 32(1) IEA.",
                "litigator_warning": "Probe electronic recording under Section 105/183 BNSS if dying declaration was recorded on camera.",
            }
        ],
    },
]


def get_all_concordance_pairs() -> list[dict[str, Any]]:
    """Return complete database of concordance mappings."""
    return CRIMINAL_CONCORDANCE_DATA
