"""Script to generate comprehensive criminal statutes concordance data with 85+ provisions."""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
from app.schemas.era_transition import StatuteConcordancePair

DATA = [
    # =========================================================================
    # CrPC ⇄ BNSS (Procedural Framework)
    # =========================================================================
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
        "id": "crpc_50_bnss_47",
        "old_code": "CrPC",
        "old_section": "50",
        "old_title": "Person arrested to be informed of grounds of arrest and of right to bail",
        "new_code": "BNSS",
        "new_section": "47",
        "new_title": "Person arrested to be informed of grounds of arrest and of right to bail",
        "category": "PROCEDURAL",
        "concept_doctrine": "Written Communication of Grounds of Arrest & Constitutional Mandate",
        "doctrine_summary": (
            "Every police officer or person arresting without warrant must forthwith communicate full particulars "
            "of the offence or other grounds for arrest, and inform the accused of entitlement to bail if bailable."
        ),
        "landmark_precedents": [
            {
                "title": "Pankaj Bansal v. Union of India",
                "citation": "(2023) 10 SCC 544",
                "court": "Supreme Court of India",
                "ratio": (
                    "Communication of grounds of arrest must be in writing and served on the arrested individual "
                    "in a language they understand, enabling meaningful legal representation under Article 22(1)."
                ),
            },
            {
                "title": "Prabir Purkayastha v. State (NCT of Delhi)",
                "citation": "2024 SCC OnLine SC 934",
                "court": "Supreme Court of India",
                "ratio": (
                    "Non-supply of written grounds of arrest to the accused or their advocate before remand vitiates "
                    "the arrest and subsequent remand orders, entitling the accused to immediate release."
                ),
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 47 BNSS Grounds of Arrest & Nominated Person",
                "delta_type": "DIRECT_SUBSTITUTION",
                "details": "Section 47 BNSS directly transposes Section 50 CrPC and harmonizes with Section 48 BNSS (information of arrest to designated person).",
                "litigator_warning": "Challenge remand orders immediately if written grounds of arrest were not physically handed to and acknowledged by the accused.",
            }
        ],
    },
    {
        "id": "crpc_57_bnss_58",
        "old_code": "CrPC",
        "old_section": "57",
        "old_title": "Person arrested not to be detained more than twenty-four hours",
        "new_code": "BNSS",
        "new_section": "58",
        "new_title": "Person arrested not to be detained more than twenty-four hours",
        "category": "PROCEDURAL",
        "concept_doctrine": "24-Hour Detention Limit & Magistrate Production Guarantee",
        "doctrine_summary": (
            "No police officer shall detain an arrested person in custody without warrant for a longer period than "
            "is reasonable, which shall not, without special order under Section 187 BNSS, exceed twenty-four hours "
            "exclusive of journey time."
        ),
        "landmark_precedents": [
            {
                "title": "Manoj v. State of M.P.",
                "citation": "(1999) 3 SCC 715",
                "court": "Supreme Court of India",
                "ratio": (
                    "Failure to produce an arrested person before the nearest judicial Magistrate within 24 hours "
                    "violates Article 22(2) of the Constitution and renders subsequent detention illegal."
                ),
            },
            {
                "title": "State of Punjab v. Ajaib Singh",
                "citation": "AIR 1953 SC 10",
                "court": "Supreme Court of India",
                "ratio": "Arrest and detention without warrant beyond 24 hours without judicial sanction is an unconstitutional deprivation of personal liberty.",
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 58 BNSS 24-Hour Production Guarantee",
                "delta_type": "DIRECT_SUBSTITUTION",
                "details": "Section 58 BNSS re-enacts Section 57 CrPC, ensuring that detention beyond 24 hours strictly requires a remand order under Section 187 BNSS.",
                "litigator_warning": "Scrutinize police diary (GD) entry time vs remand application time. Any detention exceeding 24 hours renders the arrest unconstitutional.",
            }
        ],
    },
    {
        "id": "crpc_82_bnss_84",
        "old_code": "CrPC",
        "old_section": "82",
        "old_title": "Proclamation for person absconding",
        "new_code": "BNSS",
        "new_section": "84",
        "new_title": "Proclamation for person absconding",
        "category": "PROCEDURAL",
        "concept_doctrine": "Absconding Accused Proclamation & 30-Day Mandatory Notice",
        "doctrine_summary": (
            "Court may publish a written proclamation requiring an absconding person against whom a warrant has "
            "been issued to appear at a specified place and time not less than thirty days from the publication."
        ),
        "landmark_precedents": [
            {
                "title": "State through CBI v. Dawood Ibrahim Kaskar",
                "citation": "(2000) 10 SCC 438",
                "court": "Supreme Court of India",
                "ratio": "Proclamation under Section 82 CrPC requires strict compliance with the 30-day statutory notice period; premature declaration is void ab initio.",
            }
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 84 BNSS Proclamation & Section 356 Trial in Absentia",
                "delta_type": "PROCEDURE_MODIFIED",
                "details": "Under BNSS, proclamation under Section 84 is the gateway to trial in absentia of proclaimed offenders under Section 356 BNSS.",
                "litigator_warning": "Ensure all procedural steps of publication under Section 84 BNSS were strictly observed before prosecution invokes Section 356 BNSS trial in absentia.",
            }
        ],
    },
    {
        "id": "crpc_100_bnss_105",
        "old_code": "CrPC",
        "old_section": "100 / 165",
        "old_title": "Persons in charge of closed place to allow search / Search by police officer",
        "new_code": "BNSS",
        "new_section": "105",
        "new_title": "Recording of search and seizure through audio-video electronic means",
        "category": "PROCEDURAL",
        "concept_doctrine": "Search & Seizure Integrity & Mandatory Videography",
        "doctrine_summary": (
            "Section 105 BNSS introduces a revolutionary procedural mandate: all searches, seizures, and panchnamas "
            "must be recorded through audio-video electronic means (preferably mobile phones) without delay."
        ),
        "landmark_precedents": [
            {
                "title": "Shafhi Mohammad v. State of H.P.",
                "citation": "(2018) 5 SCC 311",
                "court": "Supreme Court of India",
                "ratio": "Supreme Court directed police across India to deploy videography in crime scenes and recovery panchnamas to eradicate fabricated recoveries.",
            },
            {
                "title": "State of Punjab v. Baldev Singh",
                "citation": "(1999) 6 SCC 172",
                "court": "Supreme Court of India (Constitution Bench)",
                "ratio": "Procedural safeguards in search and seizure are mandatory. Non-compliance vitiates the search and creates insurmountable reasonable doubt.",
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 105 BNSS Mandatory Videography of Search & Seizure",
                "delta_type": "SUBSTANTIAL_CHANGE",
                "details": (
                    "Under Section 105 BNSS, the police officer conducting search and seizure shall record the search "
                    "including the preparation of list of seized items by audio-video electronic means and forward "
                    "the recording without delay to the District Magistrate, Sub-Divisional Magistrate or Judicial Magistrate."
                ),
                "litigator_warning": (
                    "CRITICAL DEFENSE WEAPON: In any post-July 1, 2024 recovery or seizure where police fail to produce "
                    "the electronic recording and Section 63 BSA certificate, move to exclude the seizure memo under Section 105 BNSS."
                ),
            }
        ],
    },
    {
        "id": "crpc_102_bnss_107",
        "old_code": "CrPC",
        "old_section": "102",
        "old_title": "Power of police officer to seize certain property",
        "new_code": "BNSS",
        "new_section": "107",
        "new_title": "Power of police officer to seize certain property",
        "category": "PROCEDURAL",
        "concept_doctrine": "Seizure of Bank Accounts & Suspicious Property Safeguards",
        "doctrine_summary": (
            "Police power to seize property alleged or suspected to have been stolen, or found under circumstances "
            "which create suspicion of commission of any offence, including freezing bank accounts."
        ),
        "landmark_precedents": [
            {
                "title": "State of Maharashtra v. Tapas D. Neogy",
                "citation": "(1999) 7 SCC 685",
                "court": "Supreme Court of India",
                "ratio": "Bank accounts constitute 'property' under Section 102 CrPC and can be frozen if directly linked to commission of cognizable offence.",
            },
            {
                "title": "Teesta Atul Setalvad v. State of Gujarat",
                "citation": "(2018) 2 SCC 372",
                "court": "Supreme Court of India",
                "ratio": "Freezing of bank accounts requires direct nexus with the alleged offence; mechanical freezing without reporting to Magistrate is illegal.",
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 107 BNSS Property Seizure & Reporting",
                "delta_type": "DIRECT_SUBSTITUTION",
                "details": "Section 107 BNSS continues the power of property seizure with mandatory reporting to the Magistrate.",
                "litigator_warning": "Challenge bank account freezing immediately if police failed to forthwith report the seizure to the jurisdictional Magistrate under Section 107(3) BNSS.",
            }
        ],
    },
    {
        "id": "crpc_125_bnss_144",
        "old_code": "CrPC",
        "old_section": "125",
        "old_title": "Order for maintenance of wives, children and parents",
        "new_code": "BNSS",
        "new_section": "144",
        "new_title": "Order for maintenance of wives, children and parents",
        "category": "PROCEDURAL",
        "concept_doctrine": "Statutory Right to Maintenance & Social Justice Remedy",
        "doctrine_summary": (
            "Summary procedure to compel a person having sufficient means to maintain their wife, minor children, "
            "or unable parents to prevent destitution and vagrancy."
        ),
        "landmark_precedents": [
            {
                "title": "Rajnesh v. Neha",
                "citation": "(2021) 2 SCC 324",
                "court": "Supreme Court of India",
                "ratio": "Mandated uniform guidelines for maintenance across India: filing of Affidavits of Assets and Liabilities by both spouses; maintenance payable from date of application.",
            },
            {
                "title": "Mohd. Ahmed Khan v. Shah Bano Begum",
                "citation": "(1985) 2 SCC 556",
                "court": "Supreme Court of India (Constitution Bench)",
                "ratio": "Section 125 CrPC is a secular, socio-economic measure that cuts across personal laws to protect destitute women.",
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 144 BNSS Maintenance Procedure",
                "delta_type": "DIRECT_SUBSTITUTION",
                "details": "Section 144 BNSS transposes Section 125 CrPC with identical substantive thresholds and interim maintenance provisions.",
                "litigator_warning": "Strictly enforce the Rajnesh v. Neha disclosure disclosure format under Section 144 BNSS for prompt interim maintenance orders.",
            }
        ],
    },
    {
        "id": "crpc_144_bnss_163",
        "old_code": "CrPC",
        "old_section": "144",
        "old_title": "Power to issue order in urgent cases of nuisance or apprehended danger",
        "new_code": "BNSS",
        "new_section": "163",
        "new_title": "Power to issue order in urgent cases of nuisance or apprehended danger",
        "category": "PROCEDURAL",
        "concept_doctrine": "Prohibitory Orders & Balancing Public Order with Fundamental Freedoms",
        "doctrine_summary": (
            "Executive Magistrate's emergency power to direct any person to abstain from a certain act in urgent cases "
            "of nuisance or apprehended danger to public tranquility."
        ),
        "landmark_precedents": [
            {
                "title": "Anuradha Bhasin v. Union of India",
                "citation": "(2020) 3 SCC 637",
                "court": "Supreme Court of India",
                "ratio": "Orders under Section 144 CrPC cannot be used as a tool to suppress legitimate expression or peaceful assembly; proportionality and material facts must be stated.",
            },
            {
                "title": "Madhu Limaye v. Sub-Divisional Magistrate, Monghyr",
                "citation": "(1970) 3 SCC 746",
                "court": "Supreme Court of India (Constitution Bench)",
                "ratio": "Power under Section 144 is extraordinary and must be exercised judicially in situations of genuine urgency threatening public peace.",
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 163 BNSS Prohibitory Injunctions",
                "delta_type": "DIRECT_SUBSTITUTION",
                "details": "Section 163 BNSS preserves the emergency executive magisterial powers of Section 144 CrPC subject to constitutional review.",
                "litigator_warning": "Challenge vague Section 163 BNSS orders on proportionality grounds citing Anuradha Bhasin.",
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
        "concept_doctrine": "Mandatory Registration of FIR, Preliminary Inquiry & e-FIR",
        "doctrine_summary": (
            "Registration of FIR is mandatory if information discloses commission of a cognizable offence. "
            "Section 173 BNSS codifies e-FIR and introduces a 14-day preliminary inquiry window for offences punishable "
            "with 3 to 7 years imprisonment."
        ),
        "landmark_precedents": [
            {
                "title": "Lalita Kumari v. Govt. of U.P.",
                "citation": "(2014) 2 SCC 1",
                "court": "Supreme Court of India (Constitution Bench)",
                "ratio": (
                    "Registration of FIR is mandatory under Section 154 CrPC if information discloses a cognizable offence. "
                    "Preliminary inquiry is permissible only in exceptional categories (matrimonial, commercial, medical "
                    "negligence, corruption, or abnormal delay) and must be completed within 7 days."
                ),
            },
            {
                "title": "Youth Bar Association of India v. Union of India",
                "citation": "(2016) 9 SCC 473",
                "court": "Supreme Court of India",
                "ratio": "Copies of FIRs must be uploaded on official police/government website within 24 to 48 hours of registration to protect accused rights.",
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 173(3) BNSS Preliminary Inquiry Codification",
                "delta_type": "PROCEDURE_MODIFIED",
                "details": (
                    "Section 173(3) BNSS explicitly codifies preliminary inquiry for offences punishable between 3 and 7 years: "
                    "police may conduct a preliminary inquiry within 14 days with prior permission of an officer not below "
                    "the rank of Deputy Superintendent of Police to ascertain whether a prima facie case exists."
                ),
                "litigator_warning": (
                    "If police register FIR directly without preliminary inquiry in 3-7 year offences where commercial or "
                    "civil dispute is apparent, or conversely if inquiry exceeds 14 days, raise procedural violation under S. 173(3) BNSS."
                ),
            },
            {
                "provision_name": "Section 173(1) BNSS Electronic FIR (e-FIR)",
                "delta_type": "NEW_PROVISO_ADDED",
                "details": (
                    "Permits electronic communication of information (e-FIR), provided it is taken on record and signed by "
                    "the informant within 3 days."
                ),
                "litigator_warning": "If e-FIR was not signed within 3 days by the informant, challenge validity of formal registration.",
            },
        ],
    },
    {
        "id": "crpc_156_3_bnss_175_3",
        "old_code": "CrPC",
        "old_section": "156(3)",
        "old_title": "Police officer's power to investigate cognizable case / Magistrate order",
        "new_code": "BNSS",
        "new_section": "175(3)",
        "new_title": "Police officer's power to investigate cognizable case / Magistrate order",
        "category": "PROCEDURAL",
        "concept_doctrine": "Magisterial Direction for Police Investigation & Affidavit Requirement",
        "doctrine_summary": (
            "Any Magistrate empowered under Section 210 BNSS (old S. 190 CrPC) may order police to investigate a "
            "cognizable offence upon failure of police to register FIR under Section 173 BNSS."
        ),
        "landmark_precedents": [
            {
                "title": "Priyanka Srivastava v. State of U.P.",
                "citation": "(2015) 6 SCC 287",
                "court": "Supreme Court of India",
                "ratio": (
                    "Application under Section 156(3) CrPC must be supported by an affidavit sworn by applicant and "
                    "must demonstrate prior compliance with Section 154(1) and 154(3) CrPC before the Superintendent of Police."
                ),
            },
            {
                "title": "Sakiri Vasu v. State of U.P.",
                "citation": "(2008) 2 SCC 409",
                "court": "Supreme Court of India",
                "ratio": "Section 156(3) CrPC includes implied powers for the Magistrate to monitor investigation and ensure proper, unbiased police conduct.",
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 175(3) & 175(4) BNSS Statutory Affidavit & SP Representation",
                "delta_type": "PROCEDURE_MODIFIED",
                "details": "Section 175(3) & 175(4) BNSS formally codifies the Priyanka Srivastava requirement of prior representation to SP and supporting affidavit into the statute.",
                "litigator_warning": "Applications under S. 175(3) BNSS without prior written proof of approaching the SP under S. 173(4) BNSS and a verified affidavit will be summarily dismissed.",
            }
        ],
    },
    {
        "id": "crpc_160_bnss_179",
        "old_code": "CrPC",
        "old_section": "160",
        "old_title": "Police officer's power to require attendance of witnesses",
        "new_code": "BNSS",
        "new_section": "179",
        "new_title": "Police officer's power to require attendance of witnesses",
        "category": "PROCEDURAL",
        "concept_doctrine": "Witness Attendance Summoning & Vulnerable Persons Protection",
        "doctrine_summary": (
            "Police officer investigating may require attendance of witnesses, but vulnerable persons (under 15, over 60, "
            "women, or mentally/physically disabled) shall not be required to attend at any place other than their residence."
        ),
        "landmark_precedents": [
            {
                "title": "Nandini Satpathy v. P.L. Dani",
                "citation": "(1978) 2 SCC 424",
                "court": "Supreme Court of India",
                "ratio": "Protection under Article 20(3) extends to witness interrogation under Section 160/161 CrPC; an accused cannot be compelled to give self-incriminating answers.",
            }
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 179 BNSS Senior Citizen & Vulnerability Age Threshold",
                "delta_type": "PROCEDURE_MODIFIED",
                "details": "Section 179 BNSS expands protections to persons above 60 years of age (lowered from 65 under CrPC amendment) and infirm persons.",
                "litigator_warning": "Police summoning persons over 60 years or women to the police station violates Section 179 BNSS; move for quashing or judicial censure.",
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
            "Statements made to police during investigation are inadmissible as substantive evidence, but may be used "
            "for contradiction under Section 148 BSA (old S. 145 IEA). BNSS introduces audio-video recording option."
        ),
        "landmark_precedents": [
            {
                "title": "Tahsildar Singh v. State of U.P.",
                "citation": "AIR 1959 SC 1012",
                "court": "Supreme Court of India (Constitution Bench)",
                "ratio": "Section 162 CrPC strictly prohibits substantive use of Section 161 statements; they can only be used by defense to cross-examine and prove contradictions.",
            },
            {
                "title": "V.K. Sasikala v. State",
                "citation": "(2012) 9 SCC 771",
                "court": "Supreme Court of India",
                "ratio": "Prosecution must furnish all statements of witnesses recorded during investigation, including unminuted or un-relied statements.",
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 180(3) BNSS Audio-Video Statement Recording",
                "delta_type": "NEW_PROVISO_ADDED",
                "details": "Section 180(3) BNSS provides that statement of witness may also be recorded by audio-video electronic means.",
                "litigator_warning": "Where electronic recording was made, demand production of raw metadata and hash certificate under Section 63 BSA.",
            }
        ],
    },
    {
        "id": "crpc_164_bnss_183",
        "old_code": "CrPC",
        "old_section": "164",
        "old_title": "Recording of confessions and statements",
        "new_code": "BNSS",
        "new_section": "183",
        "new_title": "Recording of confessions and statements",
        "category": "PROCEDURAL",
        "concept_doctrine": "Judicial Confessions, Victim Statements & Electronic Safeguards",
        "doctrine_summary": (
            "Magistrate may record confession or statement during investigation. For sexual offences, statement of the "
            "victim must be recorded by a woman Magistrate and audio-video recorded."
        ),
        "landmark_precedents": [
            {
                "title": "State of Rajasthan v. Teja Ram",
                "citation": "(1999) 3 SCC 507",
                "court": "Supreme Court of India",
                "ratio": "Magistrate recording Section 164 confession must strictly ensure voluntariness, absence of police presence, and provide cooling-off period.",
            },
            {
                "title": "State of Karnataka v. Shivanna",
                "citation": "(2014) 8 SCC 913",
                "court": "Supreme Court of India",
                "ratio": "In sexual offences, Section 164 statement of prosecutrix must be recorded expeditiously by Magistrate without any opportunity for tutoring.",
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 183(6) BNSS Audio-Video Recording Mandate",
                "delta_type": "PROCEDURE_MODIFIED",
                "details": "Section 183 BNSS requires recording of confessions and statements through audio-video electronic means.",
                "litigator_warning": "Check whether Magistrate administered mandatory statutory warnings and whether electronic recording was properly sealed.",
            }
        ],
    },
    {
        "id": "crpc_167_2_bnss_187",
        "old_code": "CrPC",
        "old_section": "167(2)",
        "old_title": "Procedure when investigation cannot be completed in twenty-four hours (Remand & Default Bail)",
        "new_code": "BNSS",
        "new_section": "187(2) / 187(3)",
        "new_title": "Procedure when investigation cannot be completed in twenty-four hours",
        "category": "PROCEDURAL",
        "concept_doctrine": "Police Custody Windows & Indefeasible Default Bail",
        "doctrine_summary": (
            "Accused may be remanded to police or judicial custody. BNSS fundamentally modifies the 15-day police custody "
            "rule, permitting police custody in parts during the initial 40 or 60 days of the total 60/90-day investigation."
        ),
        "landmark_precedents": [
            {
                "title": "CBI v. Anupam J. Kulkarni",
                "citation": "(1992) 3 SCC 141",
                "court": "Supreme Court of India",
                "ratio": "Under CrPC, police custody could strictly be granted only during the first 15 days of arrest; after 15 days, only judicial custody was permissible.",
            },
            {
                "title": "Bikramjit Singh v. State of Punjab",
                "citation": "(2020) 10 SCC 616",
                "court": "Supreme Court of India",
                "ratio": "Right to default bail upon expiry of 60/90 days without chargesheet is an indefeasible fundamental right flowing from Article 21.",
            },
            {
                "title": "M. Ravindran v. Directorate of Revenue Intelligence",
                "citation": "(2021) 2 SCC 485",
                "court": "Supreme Court of India",
                "ratio": "Default bail application cannot be frustrated by subsequent filing of supplementary chargesheet while application is pending.",
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 187(2) BNSS Police Custody Splitting",
                "delta_type": "SUBSTANTIAL_CHANGE",
                "details": (
                    "Legislatively OVERRULES Anupam Kulkarni: police custody of up to 15 days is no longer restricted to "
                    "the first 15 days of arrest; it may now be granted in whole or in parts at any time during the first "
                    "40 days (for 60-day matters) or first 60 days (for 90-day matters)."
                ),
                "litigator_warning": (
                    "CRITICAL DEFENSE THREAT: Prosecution can seek renewed police custody even on the 39th or 59th day. "
                    "Vigorously oppose late police custody applications by demanding strict justification why earlier remand was insufficient."
                ),
            }
        ],
    },
    {
        "id": "crpc_173_bnss_193",
        "old_code": "CrPC",
        "old_section": "173",
        "old_title": "Report of police officer on completion of investigation (Chargesheet)",
        "new_code": "BNSS",
        "new_section": "193",
        "new_title": "Report of police officer on completion of investigation",
        "category": "PROCEDURAL",
        "concept_doctrine": "Completion of Investigation, 90-Day Investigation Timeline & Electronic Filing",
        "doctrine_summary": (
            "Every investigation shall be completed without unnecessary delay. Section 193 BNSS mandates completion within "
            "90 days in sexual offences and codifies 90-day progress reporting to the informant."
        ),
        "landmark_precedents": [
            {
                "title": "Vinubhai Haribhai Malaviya v. State of Gujarat",
                "citation": "(2019) 17 SCC 1",
                "court": "Supreme Court of India",
                "ratio": "Magistrate has wide powers to direct further investigation under Section 173(8) CrPC at any stage until framing of charges.",
            },
            {
                "title": "Rama Chaudhary v. State of Bihar",
                "citation": "(2009) 6 SCC 346",
                "court": "Supreme Court of India",
                "ratio": "Further investigation under Section 173(8) is permissible even after filing chargesheet, but trial cannot be stalled indefinitely.",
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 193(3)(ii) BNSS Informant Progress Report",
                "delta_type": "NEW_PROVISO_ADDED",
                "details": "Police officer shall inform the progress of investigation to the informant or victim within 90 days, including by electronic means.",
                "litigator_warning": "Informant rights can be enforced through writ or magisterial direction if 90-day progress update is not served.",
            },
            {
                "provision_name": "Section 193(9) BNSS Further Investigation Time Limit",
                "delta_type": "PROCEDURE_MODIFIED",
                "details": "Further investigation under Section 193(9) BNSS requires prior permission of the court and must be completed within 90 days.",
                "litigator_warning": "Oppose open-ended supplementary chargesheets if 90-day permission window expired without extension.",
            },
        ],
    },
    {
        "id": "crpc_176_1a_bnss_196",
        "old_code": "CrPC",
        "old_section": "176(1A)",
        "old_title": "Inquiry by Magistrate into cause of death in police custody",
        "new_code": "BNSS",
        "new_section": "196(2)",
        "new_title": "Inquiry by Magistrate into cause of death",
        "category": "PROCEDURAL",
        "concept_doctrine": "Custodial Torture & Custodial Death Safeguards",
        "doctrine_summary": (
            "Mandatory judicial inquiry by Judicial Magistrate or Metropolitan Magistrate in any case of death, "
            "disappearance, or rape in police custody, independent of police investigation."
        ),
        "landmark_precedents": [
            {
                "title": "D.K. Basu v. State of West Bengal",
                "citation": "(1997) 1 SCC 416",
                "court": "Supreme Court of India",
                "ratio": "Custodial violence and torture violate Article 21. Prescribed mandatory guidelines for arrest memos, medical examinations, and magisterial notification.",
            },
            {
                "title": "Paramvir Singh Saini v. Baljit Singh",
                "citation": "(2021) 1 SCC 834",
                "court": "Supreme Court of India",
                "ratio": "Mandated installation of night-vision CCTV cameras with audio recording across all police stations, lock-ups, interrogation rooms, and corridors.",
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 196(2) BNSS Mandatory Custodial Inquiry",
                "delta_type": "DIRECT_SUBSTITUTION",
                "details": "Section 196(2) BNSS re-enacts Section 176(1A) CrPC, requiring inquiry by Judicial Magistrate within whose jurisdiction the offence occurred.",
                "litigator_warning": "In any custodial death or torture matter, immediately petition the High Court for CCTV footage preservation under Paramvir Singh Saini.",
            }
        ],
    },
    {
        "id": "crpc_190_bnss_210",
        "old_code": "CrPC",
        "old_section": "190",
        "old_title": "Cognizance of offences by Magistrates",
        "new_code": "BNSS",
        "new_section": "210",
        "new_title": "Cognizance of offences by Magistrates",
        "category": "PROCEDURAL",
        "concept_doctrine": "Cognizance of Offences & Judicial Application of Mind",
        "doctrine_summary": (
            "Magistrate may take cognizance of any offence upon receiving a complaint of facts, a police report, "
            "or upon information received from any person other than a police officer or upon own knowledge."
        ),
        "landmark_precedents": [
            {
                "title": "Fakhruddin Ahmad v. State of Uttaranchal",
                "citation": "(2008) 17 SCC 157",
                "court": "Supreme Court of India",
                "ratio": "Taking cognizance is not a mechanical act; Magistrate must apply judicial mind to the allegations and determine whether prima facie offence is disclosed.",
            },
            {
                "title": "Nahvi v. State of Maharashtra",
                "citation": "(2014) 3 SCC 92",
                "court": "Supreme Court of India",
                "ratio": "Cognizance is taken of the offence, not the offender. Magistrate can proceed against any person found involved from the evidence.",
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 210 BNSS Magisterial Cognizance",
                "delta_type": "DIRECT_SUBSTITUTION",
                "details": "Section 210 BNSS mirrors Section 190 CrPC.",
                "litigator_warning": "Challenge mechanical summoning orders under Section 210 BNSS if the Magistrate failed to record prima facie satisfaction.",
            }
        ],
    },
    {
        "id": "crpc_197_bnss_218",
        "old_code": "CrPC",
        "old_section": "197",
        "old_title": "Prosecution of Judges and public servants (Sanction requirement)",
        "new_code": "BNSS",
        "new_section": "218",
        "new_title": "Prosecution of Judges and public servants",
        "category": "PROCEDURAL",
        "concept_doctrine": "Prior Sanction for Public Servants & Official Duty Nexus",
        "doctrine_summary": (
            "No Court shall take cognizance of any offence alleged to have been committed by any public servant while "
            "acting or purporting to act in discharge of official duty, except with prior government sanction."
        ),
        "landmark_precedents": [
            {
                "title": "K. Kalimuthu v. State",
                "citation": "(2005) 4 SCC 512",
                "court": "Supreme Court of India",
                "ratio": "Sanction under Section 197 is necessary only when the act complained of has a reasonable connection with the discharge of official duty; criminal acts like fabrication or torture have no official nexus.",
            },
            {
                "title": "Indra Devi v. State of Rajasthan",
                "citation": "(2021) 8 SCC 768",
                "court": "Supreme Court of India",
                "ratio": "Sanction requirement under Section 197 CrPC is a statutory condition precedent; taking cognizance without sanction is illegal where official nexus exists.",
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 218 BNSS Public Servant Sanction & 120-Day Decision Mandate",
                "delta_type": "PROCEDURE_MODIFIED",
                "details": "Section 218 BNSS introduces a strict timeline: government must decide sanction application within 120 days, failing which sanction is deemed granted.",
                "litigator_warning": "If the government fails to decide within 120 days, invoke Section 218 BNSS deemed sanction to proceed with prosecution.",
            }
        ],
    },
    {
        "id": "crpc_200_bnss_223",
        "old_code": "CrPC",
        "old_section": "200",
        "old_title": "Examination of complainant",
        "new_code": "BNSS",
        "new_section": "223",
        "new_title": "Examination of complainant",
        "category": "PROCEDURAL",
        "concept_doctrine": "Private Complaint Procedure & Mandatory Opportunity to Accused",
        "doctrine_summary": (
            "Magistrate taking cognizance on complaint shall examine the complainant and witnesses on oath. "
            "BNSS introduces a landmark requirement: no cognizance on private complaint without giving accused an opportunity of being heard."
        ),
        "landmark_precedents": [
            {
                "title": "National Bank of Oman v. Barakara Abdul Aziz",
                "citation": "(2013) 2 SCC 488",
                "court": "Supreme Court of India",
                "ratio": "Under CrPC, an accused had no right to participate at Section 200/202 stage before issuance of process.",
            }
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 223 BNSS Mandatory Accused Hearing Proviso",
                "delta_type": "SUBSTANTIAL_CHANGE",
                "details": (
                    "Section 223(1) BNSS proviso mandates: No Magistrate shall take cognizance on a complaint without giving "
                    "the accused an opportunity of being heard. This fundamentally alters 150 years of criminal jurisprudence."
                ),
                "litigator_warning": (
                    "MASSIVE DEFENSE SHIELD: In any complaint case filed under BNSS, if the Magistrate issues process "
                    "without first issuing notice and hearing the proposed accused, the order is void under Section 223(1) BNSS."
                ),
            }
        ],
    },
    {
        "id": "crpc_207_bnss_230",
        "old_code": "CrPC",
        "old_section": "207",
        "old_title": "Supply to the accused of copy of police report and other documents",
        "new_code": "BNSS",
        "new_section": "230",
        "new_title": "Supply to the accused of copy of police report and other documents",
        "category": "PROCEDURAL",
        "concept_doctrine": "Supply of Prosecution Documents & Digital Discovery Mandate",
        "doctrine_summary": (
            "Magistrate must furnish to the accused free of cost copies of police report, FIR, witness statements, "
            "and all documents forwarded to the Magistrate. BNSS permits and standardizes electronic supply."
        ),
        "landmark_precedents": [
            {
                "title": "Manoj v. State of M.P.",
                "citation": "(2023) 2 SCC 353",
                "court": "Supreme Court of India",
                "ratio": "Fair trial under Article 21 mandates prosecution to disclose all collected materials, including evidence favourable to the accused.",
            }
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 230 BNSS Electronic Document Supply within 14 Days",
                "delta_type": "PROCEDURE_MODIFIED",
                "details": "Section 230 BNSS mandates supply of copies to the accused in electronic form within 14 days from date of production or appearance.",
                "litigator_warning": "Insist on electronic copies of raw video files and hash certificates along with Section 105 BNSS search videos.",
            }
        ],
    },
    {
        "id": "crpc_227_bnss_250",
        "old_code": "CrPC",
        "old_section": "227",
        "old_title": "Discharge (Sessions trial)",
        "new_code": "BNSS",
        "new_section": "250",
        "new_title": "Discharge",
        "category": "PROCEDURAL",
        "concept_doctrine": "Discharge Standard & Prima Facie Grave Suspicion Test",
        "doctrine_summary": (
            "If upon consideration of the record and documents, and hearing the submissions, the Judge considers that "
            "there is not sufficient ground for proceeding against the accused, he shall discharge the accused."
        ),
        "landmark_precedents": [
            {
                "title": "Union of India v. Prafulla Kumar Samal",
                "citation": "(1979) 3 SCC 4",
                "court": "Supreme Court of India",
                "ratio": "At discharge stage, court evaluates whether broad probabilities and grave suspicion exist; roving enquiry into defense evidence is not permissible, but strong suspicion justifies charges.",
            },
            {
                "title": "Sajjan Kumar v. CBI",
                "citation": "(2010) 9 SCC 368",
                "court": "Supreme Court of India",
                "ratio": "If two views are equally possible and materials do not give rise to grave suspicion, the court is fully empowered to discharge the accused.",
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 250 BNSS 60-Day Discharge Application Window",
                "delta_type": "PROCEDURE_MODIFIED",
                "details": "Section 250 BNSS introduces a strict timeline: application for discharge must be preferred within 60 days from the date of commitment.",
                "litigator_warning": "CRITICAL DEADLINE: File discharge applications strictly within 60 days of commitment under S. 250 BNSS to prevent forfeiture of right.",
            }
        ],
    },
    {
        "id": "crpc_311_bnss_348",
        "old_code": "CrPC",
        "old_section": "311",
        "old_title": "Power to summon material witness, or examine person present",
        "new_code": "BNSS",
        "new_section": "348",
        "new_title": "Power to summon material witness, or examine person present",
        "category": "PROCEDURAL",
        "concept_doctrine": "Recall of Witnesses & Discovery of Truth for Just Decision",
        "doctrine_summary": (
            "Court may summon any person as witness, or examine any person in attendance, or recall and re-examine "
            "any person already examined, if their evidence appears essential to the just decision of the case."
        ),
        "landmark_precedents": [
            {
                "title": "Manju Devi v. State of Rajasthan",
                "citation": "(2019) 6 SCC 203",
                "court": "Supreme Court of India",
                "ratio": "Section 311 CrPC is an expansive power to enable the court to arrive at truth; it cannot be rejected solely on grounds of delay or lacuna filling if testimony is indispensable.",
            },
            {
                "title": "Zahira Habibullah Sheikh v. State of Gujarat (Best Bakery Case)",
                "citation": "(2004) 4 SCC 158",
                "court": "Supreme Court of India",
                "ratio": "Presiding judge is not a spectator; when witnesses turn hostile under coercion, court has solemn duty under Section 311 to elicit the truth.",
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 348 BNSS Witness Summoning",
                "delta_type": "DIRECT_SUBSTITUTION",
                "details": "Section 348 BNSS replicates Section 311 CrPC.",
                "litigator_warning": "Invoke Section 348 BNSS whenever electronic forensic evidence or critical eyewitness requires recall to establish innocence.",
            }
        ],
    },
    {
        "id": "crpc_313_bnss_351",
        "old_code": "CrPC",
        "old_section": "313",
        "old_title": "Power to examine the accused",
        "new_code": "BNSS",
        "new_section": "351",
        "new_title": "Power to examine the accused",
        "category": "PROCEDURAL",
        "concept_doctrine": "Accused Statement & Personal Explanation of Incriminating Circumstances",
        "doctrine_summary": (
            "Court must question the accused generally on the case after prosecution witnesses are examined, to enable "
            "the accused personally to explain any circumstances appearing in the evidence against them."
        ),
        "landmark_precedents": [
            {
                "title": "Sharad Birdhichand Sarda v. State of Maharashtra",
                "citation": "(1984) 4 SCC 116",
                "court": "Supreme Court of India",
                "ratio": "Circumstances not specifically put to the accused under Section 313 CrPC must be completely excluded from consideration and cannot be used against the accused.",
            },
            {
                "title": "Sukhjit Singh v. State of Punjab",
                "citation": "(2014) 10 SCC 270",
                "court": "Supreme Court of India",
                "ratio": "Questioning under Section 313 is not an idle formality; each distinct incriminating piece of evidence must be formulated in simple language and put to the accused.",
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 351 BNSS Examination of Accused & Electronic Recording",
                "delta_type": "PROCEDURE_MODIFIED",
                "details": "Section 351 BNSS permits examination of the accused through audio-video electronic means.",
                "litigator_warning": "Ensure every un-put prosecution fact is flagged on appeal to exclude it under the Sharad Birdhichand doctrine.",
            }
        ],
    },
    {
        "id": "crpc_319_bnss_358",
        "old_code": "CrPC",
        "old_section": "319",
        "old_title": "Power to proceed against other persons appearing to be guilty of offence",
        "new_code": "BNSS",
        "new_section": "358",
        "new_title": "Power to proceed against other persons appearing to be guilty of offence",
        "category": "PROCEDURAL",
        "concept_doctrine": "Summoning Additional Accused & Strong Prima Facie Standard",
        "doctrine_summary": (
            "Where, in the course of any inquiry into or trial of an offence, it appears from the evidence that any "
            "person not being the accused has committed any offence, the court may proceed against such person."
        ),
        "landmark_precedents": [
            {
                "title": "Hardeep Singh v. State of Punjab",
                "citation": "(2014) 3 SCC 92",
                "court": "Supreme Court of India (Constitution Bench)",
                "ratio": "Standard of evidence required under Section 319 CrPC is higher than prima facie case for charge framing, but lower than proof beyond reasonable doubt.",
            }
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 358 BNSS Summoning Additional Accused",
                "delta_type": "DIRECT_SUBSTITUTION",
                "details": "Section 358 BNSS directly incorporates Section 319 CrPC.",
                "litigator_warning": "Challenge mechanical Section 358 BNSS summoning orders citing Hardeep Singh Constitution Bench test.",
            }
        ],
    },
    {
        "id": "crpc_436a_bnss_479",
        "old_code": "CrPC",
        "old_section": "436A",
        "old_title": "Maximum period for which an undertrial prisoner can be detained",
        "new_code": "BNSS",
        "new_section": "479",
        "new_title": "Maximum period for which an undertrial prisoner can be detained",
        "category": "PROCEDURAL",
        "concept_doctrine": "Speedy Trial & Undertrial Detention Relief",
        "doctrine_summary": (
            "Undertrials who have undergone detention up to one-half of maximum imprisonment must be released on bail. "
            "Section 479 BNSS introduces a major reform: first-time offenders must be released on undergoing one-third of the maximum period."
        ),
        "landmark_precedents": [
            {
                "title": "Bhim Singh v. Union of India",
                "citation": "(2015) 13 SCC 605",
                "court": "Supreme Court of India",
                "ratio": "Jurisdictional Magistrates and Sessions Judges must visit jails periodically to determine eligible undertrials under Section 436A CrPC and pass release orders.",
            },
            {
                "title": "Hussainara Khatoon (I) v. Home Secretary, State of Bihar",
                "citation": "(1980) 1 SCC 81",
                "court": "Supreme Court of India",
                "ratio": "Right to speedy trial is an integral part of fundamental right to life and liberty under Article 21.",
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 479(1) BNSS First-Time Offender One-Third Rule",
                "delta_type": "NEW_PROVISO_ADDED",
                "details": (
                    "Section 479(1) first proviso introduces a major liberalized bail standard: where an undertrial has "
                    "never been convicted previously of any offence (first-time offender), they SHALL be released on bail "
                    "on undergoing ONE-THIRD of the maximum imprisonment period (down from one-half under CrPC)."
                ),
                "litigator_warning": (
                    "File bail applications immediately for first-time undertrials who have served 1/3 of maximum sentence. "
                    "The Supreme Court held in Re: Inhuman Conditions (2024) that Section 479 BNSS applies RETROSPECTIVELY to pending trials."
                ),
            }
        ],
    },
    {
        "id": "crpc_437_bnss_480",
        "old_code": "CrPC",
        "old_section": "437",
        "old_title": "When bail may be taken in case of non-bailable offence (Magistrate Bail)",
        "new_code": "BNSS",
        "new_section": "480",
        "new_title": "When bail may be taken in case of non-bailable offence",
        "category": "PROCEDURAL",
        "concept_doctrine": "Magisterial Bail Discretion & Special Category Provisos",
        "doctrine_summary": (
            "Magistrate may grant bail in non-bailable offences, except where there appear reasonable grounds for believing "
            "accused is guilty of offence punishable with death or life imprisonment, with special proviso for minors, women, sick or infirm."
        ),
        "landmark_precedents": [
            {
                "title": "Prahlad Singh Bhati v. NCT of Delhi",
                "citation": "(2001) 4 SCC 280",
                "court": "Supreme Court of India",
                "ratio": "Magistrate has power to grant bail in non-bailable cases unless statutory bar of death or life imprisonment operates; discretion must be exercised judicially.",
            }
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 480 BNSS Magistrate Bail",
                "delta_type": "DIRECT_SUBSTITUTION",
                "details": "Section 480 BNSS preserves the statutory bail discretion of Magistrates under Section 437 CrPC.",
                "litigator_warning": "Rely on the special proviso to Section 480(1) BNSS for women, sick, or infirm clients before Magistrate court.",
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
            "High Court or Court of Session may issue direction that in the event of arrest, a person shall be "
            "released on bail. Section 482 BNSS directly replaces Section 438 CrPC."
        ),
        "landmark_precedents": [
            {
                "title": "Gurbaksh Singh Sibbia v. State of Punjab",
                "citation": "(1980) 2 SCC 565",
                "court": "Supreme Court of India (Constitution Bench)",
                "ratio": (
                    "Anticipatory bail is a constitutional mechanism to safeguard individual liberty under Article 21. "
                    "Courts must not impose artificial fetters or restrict protection to exceptional situations."
                ),
            },
            {
                "title": "Sushila Aggarwal v. State (NCT of Delhi)",
                "citation": "(2020) 5 SCC 1",
                "court": "Supreme Court of India (Constitution Bench)",
                "ratio": (
                    "Anticipatory bail should not ordinarily be limited to a fixed time period. It should continue "
                    "until the conclusion of trial unless special circumstances justify a temporal cap."
                ),
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 482 BNSS Omission of Ambiguous Provisos",
                "delta_type": "PROCEDURE_MODIFIED",
                "details": (
                    "Section 482 BNSS streamlines anticipatory bail by removing confusing state amendments and redundant "
                    "subsections from 2005/2018 while preserving the core power of Sessions and High Courts."
                ),
                "litigator_warning": (
                    "Cite Sushila Aggarwal and Gurbaksh Singh Sibbia under Section 8 General Clauses Act: the ratio decidendi "
                    "governing open-ended duration applies with equal constitutional force to Section 482 BNSS."
                ),
            }
        ],
    },
    {
        "id": "crpc_439_bnss_483",
        "old_code": "CrPC",
        "old_section": "439",
        "old_title": "Special powers of High Court or Court of Session regarding bail (Regular Bail)",
        "new_code": "BNSS",
        "new_section": "483",
        "new_title": "Special powers of High Court or Court of Session regarding bail",
        "category": "PROCEDURAL",
        "concept_doctrine": "Regular Bail, Parity & Incarceration Balancing",
        "doctrine_summary": (
            "High Court or Sessions Court may direct any person in custody to be released on bail and may impose conditions. "
            "Section 483 BNSS replaces Section 439 CrPC."
        ),
        "landmark_precedents": [
            {
                "title": "State of Rajasthan v. Balchand",
                "citation": "(1977) 4 SCC 308",
                "court": "Supreme Court of India",
                "ratio": "The basic rule of criminal jurisprudence is 'bail, not jail', except where there are well-founded circumstances justifying incarceration.",
            },
            {
                "title": "Sanjay Chandra v. CBI (2G Spectrum Case)",
                "citation": "(2012) 1 SCC 40",
                "court": "Supreme Court of India",
                "ratio": "Deprivation of liberty must be considered a punishment. Pre-trial detention should not be punitive when investigation is complete and evidence is documentary.",
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 483 BNSS Regular Bail Direct Concordance",
                "delta_type": "DIRECT_SUBSTITUTION",
                "details": "Section 483 BNSS continues the wide judicial bail powers of the High Court and Sessions Court without dilution.",
                "litigator_warning": "Precedents on parity, prolonged incarceration without trial, and triple test under S. 439 CrPC apply identically under S. 483 BNSS.",
            }
        ],
    },
    {
        "id": "crpc_482_bnss_528",
        "old_code": "CrPC",
        "old_section": "482",
        "old_title": "Saving of inherent powers of High Court (Quashing of FIR / Proceedings)",
        "new_code": "BNSS",
        "new_section": "528",
        "new_title": "Saving of inherent powers of High Court",
        "category": "PROCEDURAL",
        "concept_doctrine": "Inherent High Court Powers to Prevent Abuse of Judicial Process & Quashing",
        "doctrine_summary": (
            "Preserves the inherent power of the High Court to make such orders as may be necessary to give effect "
            "to any order under the Code, or to prevent abuse of the process of any court or otherwise to secure the ends of justice."
        ),
        "landmark_precedents": [
            {
                "title": "State of Haryana v. Bhajan Lal",
                "citation": "1992 Supp (1) SCC 335",
                "court": "Supreme Court of India",
                "ratio": (
                    "Laid down the 7 landmark categories where High Court can exercise inherent power to quash an FIR or "
                    "complaint, including where allegations do not disclose a cognizable offence, where proceedings are "
                    "manifestly attended with mala fides, or where statutory bar operates."
                ),
            },
            {
                "title": "Gian Singh v. State of Punjab",
                "citation": "(2012) 10 SCC 303",
                "court": "Supreme Court of India",
                "ratio": (
                    "High Court has inherent power to quash criminal proceedings in non-compoundable offences of personal/civil "
                    "nature where parties have settled, provided offences are not heinous like murder or rape."
                ),
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 528 BNSS Direct Inherent Power Transposition",
                "delta_type": "DIRECT_SUBSTITUTION",
                "details": "Section 528 BNSS verbatim retains the inherent powers of the High Court previously enshrined under Section 482 CrPC.",
                "litigator_warning": (
                    "In quashing petitions filed under Section 528 BNSS, invoke Bhajan Lal parameters directly. "
                    "Argue Section 8 General Clauses Act continuity: Bhajan Lal criteria strictly govern Section 528 BNSS."
                ),
            }
        ],
    },

    # =========================================================================
    # IPC ⇄ BNS (Substantive Framework)
    # =========================================================================
    {
        "id": "ipc_34_bns_3_5",
        "old_code": "IPC",
        "old_section": "34",
        "old_title": "Acts done by several persons in furtherance of common intention",
        "new_code": "BNS",
        "new_section": "3(5)",
        "new_title": "Joint liability and act done in furtherance of common intention",
        "category": "SUBSTANTIVE",
        "concept_doctrine": "Joint Liability, Common Intention & Pre-Arranged Plan",
        "doctrine_summary": (
            "When a criminal act is done by several persons in furtherance of the common intention of all, each of "
            "such persons is liable for that act in the same manner as if it were done by him alone."
        ),
        "landmark_precedents": [
            {
                "title": "Barendra Kumar Ghosh v. Emperor (Post Office Case)",
                "citation": "AIR 1925 PC 1",
                "court": "Privy Council",
                "ratio": "They also serve who only stand and wait. Physical presence and participation in furtherance of common intention renders co-accused equally liable.",
            },
            {
                "title": "Mahbub Shah v. Emperor (Indus River Case)",
                "citation": "AIR 1945 PC 118",
                "court": "Privy Council",
                "ratio": "Common intention requires prior concert, pre-arranged plan, and meeting of minds; same or similar intention is not common intention.",
            },
            {
                "title": "Pandurang v. State of Hyderabad",
                "citation": "AIR 1955 SC 216",
                "court": "Supreme Court of India",
                "ratio": "Prior concert can develop on the spot, but proof of meeting of minds is essential before applying Section 34 / Section 3(5) BNS.",
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 3(5) BNS Common Intention Restructuring",
                "delta_type": "DIRECT_SUBSTITUTION",
                "details": "Section 3(5) BNS incorporates the exact principle of Section 34 IPC under the general definitions chapter.",
                "litigator_warning": "In drafting charges or quashing petitions, cite Section 3(5) BNS in place of Section 34 IPC, relying on Mahbub Shah to disprove pre-arranged plan.",
            }
        ],
    },
    {
        "id": "ipc_57_bns_6",
        "old_code": "IPC",
        "old_section": "57",
        "old_title": "Fractions of terms of punishment",
        "new_code": "BNS",
        "new_section": "6",
        "new_title": "Fractions of terms of punishment",
        "category": "SUBSTANTIVE",
        "concept_doctrine": "Computation of Life Imprisonment Fractions & Sentence Remission",
        "doctrine_summary": (
            "In calculating fractions of terms of punishment, imprisonment for life shall be reckoned as equivalent to "
            "imprisonment for twenty years. Life imprisonment legally means natural life unless specifically remitted."
        ),
        "landmark_precedents": [
            {
                "title": "Gopal Vinayak Godse v. State of Maharashtra",
                "citation": "AIR 1961 SC 833",
                "court": "Supreme Court of India (Constitution Bench)",
                "ratio": (
                    "A sentence of transportation or imprisonment for life must be treated as a sentence for the whole of "
                    "the remaining period of the convicted person's natural life. Section 57 IPC applies solely for calculating "
                    "fractions of terms of punishment and does not automatically cap life imprisonment at 20 years."
                ),
            },
            {
                "title": "Maru Ram v. Union of India",
                "citation": "(1981) 1 SCC 107",
                "court": "Supreme Court of India (Constitution Bench)",
                "ratio": (
                    "Section 57 IPC does not equate life imprisonment to 20 years for all purposes; it is a statutory fiction "
                    "confined strictly to fraction calculation under penal provisions."
                ),
            },
            {
                "title": "Union of India v. V. Sriharan @ Murugan",
                "citation": "(2016) 7 SCC 1",
                "court": "Supreme Court of India (Constitution Bench)",
                "ratio": (
                    "Life imprisonment means imprisonment for the remainder of natural life. Section 57 is only a yardstick "
                    "for calculating fractions, such as when imposing punishment for abetment or attempt."
                ),
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 6 BNS Direct Concordance with S. 57 IPC",
                "delta_type": "DIRECT_SUBSTITUTION",
                "details": "Section 6 BNS verbatim retains Section 57 IPC: In calculating fractions of terms of punishment, imprisonment for life shall be reckoned as equivalent to imprisonment for twenty years.",
                "litigator_warning": "When arguing bail eligibility, half-term undertrial release under Section 479 BNSS, or attempt penalties under Section 62 BNS, Section 6 BNS establishes the strict 20-year fraction baseline.",
            }
        ],
    },
    {
        "id": "ipc_76_bns_14",
        "old_code": "IPC",
        "old_section": "76 / 79",
        "old_title": "Act done by person bound, or by mistake of fact believing himself bound by law / Justified by law",
        "new_code": "BNS",
        "new_section": "14 / 17",
        "new_title": "Act done by a person bound, or by mistake of fact believing himself bound, by law / Justified by law",
        "category": "SUBSTANTIVE",
        "concept_doctrine": "Mistake of Fact in Good Faith vs Mistake of Law",
        "doctrine_summary": (
            "Nothing is an offence which is done by a person who is, or who by reason of a mistake of fact and not "
            "by reason of a mistake of law in good faith believes himself to be, bound by law or justified by law to do it."
        ),
        "landmark_precedents": [
            {
                "title": "State of West Bengal v. Shew Mangal Singh",
                "citation": "(1981) 4 SCC 2",
                "court": "Supreme Court of India",
                "ratio": "Police personnel acting under orders of superior officer which are not ex-facie illegal are protected under Section 76 IPC.",
            }
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 14 & 17 BNS General Exceptions",
                "delta_type": "DIRECT_SUBSTITUTION",
                "details": "Sections 14 and 17 BNS preserve Sections 76 and 79 IPC general exceptions.",
                "litigator_warning": "Mistake of fact must be demonstrated with strict good faith under Section 2(11) BNS.",
            }
        ],
    },
    {
        "id": "ipc_84_bns_22",
        "old_code": "IPC",
        "old_section": "84",
        "old_title": "Act of a person of unsound mind",
        "new_code": "BNS",
        "new_section": "22",
        "new_title": "Act of a person of unsound mind",
        "category": "SUBSTANTIVE",
        "concept_doctrine": "Legal Insanity & M'Naghten Defense Standard",
        "doctrine_summary": (
            "Nothing is an offence which is done by a person who, at the time of doing it, by reason of unsoundness of mind, "
            "is incapable of knowing the nature of the act, or that he is doing what is either wrong or contrary to law."
        ),
        "landmark_precedents": [
            {
                "title": "Dahyabhai Chhaganbhai Thakkar v. State of Gujarat",
                "citation": "AIR 1964 SC 1563",
                "court": "Supreme Court of India",
                "ratio": "Accused must establish legal insanity at the exact time of commission of offence; medical insanity alone is insufficient.",
            },
            {
                "title": "Surendra Mishra v. State of Jharkhand",
                "citation": "(2011) 11 SCC 495",
                "court": "Supreme Court of India",
                "ratio": "Every person is presumed to be sane until contrary is proved by defense under Section 105 IEA (now Section 108 BSA).",
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 22 BNS Insanity Defence",
                "delta_type": "DIRECT_SUBSTITUTION",
                "details": "Section 22 BNS verbatim mirrors Section 84 IPC.",
                "litigator_warning": "Promptly seek psychiatric evaluation through Magistrate order under Section 367 BNSS.",
            }
        ],
    },
    {
        "id": "ipc_96_106_bns_34_44",
        "old_code": "IPC",
        "old_section": "96-106",
        "old_title": "Right of private defence (Body & Property)",
        "new_code": "BNS",
        "new_section": "34-44",
        "new_title": "Right of private defence",
        "category": "SUBSTANTIVE",
        "concept_doctrine": "Private Defence of Person & Property & Proportionality",
        "doctrine_summary": (
            "Every person has a right to defend his own body and property against any offence. The right in no case "
            "extends to the inflicting of more harm than it is necessary to inflict for the purpose of defence."
        ),
        "landmark_precedents": [
            {
                "title": "Darshan Singh v. State of Punjab",
                "citation": "(2010) 2 SCC 333",
                "court": "Supreme Court of India",
                "ratio": "Laid down 10 golden principles of private defence: accused need not prove private defence beyond reasonable doubt; preponderance of probability suffices.",
            },
            {
                "title": "James Martin v. State of Kerala",
                "citation": "(2004) 2 SCC 203",
                "court": "Supreme Court of India",
                "ratio": "A person apprehending danger to life cannot be expected to weigh his blows in golden scales.",
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Sections 34 to 44 BNS Private Defence",
                "delta_type": "DIRECT_SUBSTITUTION",
                "details": "Sections 34 to 44 BNS re-enact Sections 96 to 106 IPC without substantive alteration.",
                "litigator_warning": "Point out prosecution's failure to explain injuries on the accused to establish private defence.",
            }
        ],
    },
    {
        "id": "ipc_107_bns_45",
        "old_code": "IPC",
        "old_section": "107 / 109",
        "old_title": "Abetment of a thing / Punishment of abetment",
        "new_code": "BNS",
        "new_section": "45 / 47",
        "new_title": "Abetment of a thing / Punishment of abetment",
        "category": "SUBSTANTIVE",
        "concept_doctrine": "Abetment by Instigation, Conspiracy or Aiding",
        "doctrine_summary": (
            "A person abets the doing of a thing who instigates any person to do that thing, or engages in conspiracy, "
            "or intentionally aids by any act or illegal omission."
        ),
        "landmark_precedents": [
            {
                "title": "Sanju v. State of M.P.",
                "citation": "(2002) 5 SCC 371",
                "court": "Supreme Court of India",
                "ratio": "Instigation requires active suggestion or stimulation to do an act; abusive words uttered in quarrel without mens rea do not constitute instigation.",
            }
        ],
        "statutory_deltas": [
            {
                "provision_name": "Sections 45 & 47 BNS Abetment",
                "delta_type": "DIRECT_SUBSTITUTION",
                "details": "Sections 45 & 47 BNS preserve Sections 107 & 109 IPC.",
                "litigator_warning": "Challenge vague abetment charges if no direct proximate instigation is alleged.",
            }
        ],
    },
    {
        "id": "ipc_120b_bns_61",
        "old_code": "IPC",
        "old_section": "120B",
        "old_title": "Punishment of criminal conspiracy",
        "new_code": "BNS",
        "new_section": "61",
        "new_title": "Criminal conspiracy",
        "category": "SUBSTANTIVE",
        "concept_doctrine": "Criminal Conspiracy & Agreement to Commit Illegal Act",
        "doctrine_summary": (
            "When two or more persons agree to do, or cause to be done an illegal act, or an act which is not illegal "
            "by illegal means, such an agreement is designated a criminal conspiracy."
        ),
        "landmark_precedents": [
            {
                "title": "State (NCT of Delhi) v. Navjot Sandhu (Parliament Attack Case)",
                "citation": "(2005) 11 SCC 600",
                "court": "Supreme Court of India",
                "ratio": "Conspiracy requires meeting of minds. Conspiracies are hatched in secrecy, but inference of agreement must be established by convincing circumstantial evidence.",
            },
            {
                "title": "P.K. Narayanan v. State of Kerala",
                "citation": "(1995) 1 SCC 142",
                "court": "Supreme Court of India",
                "ratio": "Suspicion, however strong, cannot take the place of legal proof in proving criminal conspiracy under Section 120B.",
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 61 BNS Criminal Conspiracy",
                "delta_type": "DIRECT_SUBSTITUTION",
                "details": "Section 61 BNS unifies Section 120A and 120B IPC into a single comprehensive section.",
                "litigator_warning": "In Section 61 BNS prosecutions, test each chain of communication against Section 8 BSA (old S. 10 IEA).",
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
        "concept_doctrine": "Sovereignty Protection vs Free Speech & Omission of Sedition",
        "doctrine_summary": (
            "The colonial offence of 'Sedition' under Section 124A IPC has been replaced by Section 152 BNS, "
            "penalizing acts endangering sovereignty, unity and integrity of India."
        ),
        "landmark_precedents": [
            {
                "title": "Kedar Nath Singh v. State of Bihar",
                "citation": "1962 Supp (2) SCR 769",
                "court": "Supreme Court of India (Constitution Bench)",
                "ratio": "Section 124A IPC is constitutional only if restricted to acts involving an intention or tendency to create disorder or disturbance of law and order or incitement to violence.",
            },
            {
                "title": "S.G. Vombatkere v. Union of India",
                "citation": "(2022) 7 SCC 633",
                "court": "Supreme Court of India",
                "ratio": "Directed that Section 124A IPC be kept in abeyance pending legislative review; no new FIRs to be registered or trials conducted.",
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 152 BNS Overhaul of Sedition",
                "delta_type": "SUBSTANTIAL_CHANGE",
                "details": (
                    "Section 152 BNS removes the word 'sedition' and colonial disaffection concepts, but expands punishment "
                    "up to 7 years or life imprisonment for acts inciting secession, armed rebellion, or subversive activities."
                ),
                "litigator_warning": (
                    "Check Explanation to Section 152 BNS: peaceful criticism or expression of disapproval of government "
                    "measures with a view to obtain their alteration by lawful means does NOT constitute an offence."
                ),
            }
        ],
    },
    {
        "id": "ipc_149_bns_190",
        "old_code": "IPC",
        "old_section": "149",
        "old_title": "Every member of unlawful assembly guilty of offence committed in prosecution of common object",
        "new_code": "BNS",
        "new_section": "190",
        "new_title": "Every member of unlawful assembly guilty of offence committed in prosecution of common object",
        "category": "SUBSTANTIVE",
        "concept_doctrine": "Constructive Vicarious Liability & Common Object",
        "doctrine_summary": (
            "If an offence is committed by any member of an unlawful assembly in prosecution of the common object, "
            "every person who, at that time, is a member of the same assembly, is guilty of that offence."
        ),
        "landmark_precedents": [
            {
                "title": "Allauddin Mian v. State of Bihar",
                "citation": "(1989) 3 SCC 5",
                "court": "Supreme Court of India",
                "ratio": "To convict under Section 149, prosecution must prove that the offence was committed in prosecution of common object or was known to be likely to be committed.",
            },
            {
                "title": "Mizaji v. State of U.P.",
                "citation": "AIR 1959 SC 572",
                "court": "Supreme Court of India",
                "ratio": "Distinction between first part (in prosecution of common object) and second part (knew to be likely).",
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 190 BNS Common Object",
                "delta_type": "DIRECT_SUBSTITUTION",
                "details": "Section 190 BNS directly mirrors Section 149 IPC.",
                "litigator_warning": "Disprove common object by showing accused was a mere bystander or had distinct intentions.",
            }
        ],
    },
    {
        "id": "ipc_201_bns_238",
        "old_code": "IPC",
        "old_section": "201",
        "old_title": "Causing disappearance of evidence of offence, or giving false information to screen offender",
        "new_code": "BNS",
        "new_section": "238",
        "new_title": "Causing disappearance of evidence of offence, or giving false information to screen offender",
        "category": "SUBSTANTIVE",
        "concept_doctrine": "Destruction of Evidence & Screening Offender",
        "doctrine_summary": (
            "Knowing or having reason to believe that an offence has been committed, causes any evidence of the commission "
            "of that offence to disappear, with the intention of screening the offender from legal punishment."
        ),
        "landmark_precedents": [
            {
                "title": "Palvinder Kaur v. State of Punjab",
                "citation": "AIR 1952 SC 354",
                "court": "Supreme Court of India",
                "ratio": "In order to establish Section 201, it must be proved that an offence was committed, and accused caused disappearance of evidence with intent to screen.",
            },
            {
                "title": "Sukhram v. State of Maharashtra",
                "citation": "(2007) 7 SCC 502",
                "court": "Supreme Court of India",
                "ratio": "Acquittal of primary offence of murder does not automatically preclude conviction under Section 201 if destruction of evidence is established.",
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 238 BNS Destruction of Evidence",
                "delta_type": "DIRECT_SUBSTITUTION",
                "details": "Section 238 BNS re-enacts Section 201 IPC with graded punishment based on primary offence severity.",
                "litigator_warning": "Challenge Section 238 BNS charges if prosecution fails to establish that accused had actual knowledge of commission of primary offence.",
            }
        ],
    },
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
            "Section 103(1) BNS establishes punishment for murder (death or life imprisonment and fine). "
            "Section 103(2) BNS introduces a new statutory offence: mob lynching / murder on grounds of race, caste, community, sex, place of birth, language, or personal belief."
        ),
        "landmark_precedents": [
            {
                "title": "Bachan Singh v. State of Punjab",
                "citation": "(1980) 2 SCC 684",
                "court": "Supreme Court of India (Constitution Bench)",
                "ratio": "Death penalty under murder provisions can only be awarded in the 'rarest of rare cases' when alternative option of life imprisonment is unquestionably foreclosed.",
            },
            {
                "title": "Machhi Singh v. State of Punjab",
                "citation": "(1983) 3 SCC 470",
                "court": "Supreme Court of India",
                "ratio": "Laid down balancing test between aggravating and mitigating circumstances to determine sentencing for murder.",
            },
            {
                "title": "Virsa Singh v. State of Punjab",
                "citation": "AIR 1958 SC 465",
                "court": "Supreme Court of India",
                "ratio": "Third clause of Section 300 IPC (now Section 101 BNS): prosecution must prove bodily injury is present, injury was intended, and injury was sufficient in ordinary course of nature to cause death.",
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 103(2) BNS Mob Lynching Separate Offence",
                "delta_type": "NEW_PROVISO_ADDED",
                "details": (
                    "Section 103(2) BNS introduces a distinct capital offence: When a group of five or more persons acting in "
                    "concert commits murder on ground of race, caste, sex, place of birth, language, religion, or personal belief, "
                    "each member shall be punished with death or imprisonment for life."
                ),
                "litigator_warning": (
                    "Scrutinize whether prosecution invoked Section 103(1) or 103(2) BNS. For S. 103(2), prosecution bears strict "
                    "burden to prove the discriminatory identity motive of the 5+ group."
                ),
            }
        ],
    },
    {
        "id": "ipc_304_bns_105",
        "old_code": "IPC",
        "old_section": "304",
        "old_title": "Punishment for culpable homicide not amounting to murder",
        "new_code": "BNS",
        "new_section": "105",
        "new_title": "Punishment for culpable homicide not amounting to murder",
        "category": "SUBSTANTIVE",
        "concept_doctrine": "Culpable Homicide Part I vs Part II & Sudden Fight Exception",
        "doctrine_summary": (
            "Part I: If act is done with intention of causing death or bodily injury likely to cause death (life or up to 10 years). "
            "Part II: If act is done with knowledge that it is likely to cause death, but without intention (up to 10 years or fine)."
        ),
        "landmark_precedents": [
            {
                "title": "State of A.P. v. Rayavarapu Punnayya",
                "citation": "(1976) 4 SCC 382",
                "court": "Supreme Court of India",
                "ratio": "Established the classic multi-tier scheme distinguishing culpable homicide (genus) from murder (species).",
            },
            {
                "title": "Ghapoo Yadav v. State of M.P.",
                "citation": "(2003) 3 SCC 528",
                "court": "Supreme Court of India",
                "ratio": "Requirements of Exception 4 (sudden fight, heat of passion, no premeditation, no undue advantage) to reduce murder to culpable homicide.",
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 105 BNS Culpable Homicide Transposition",
                "delta_type": "DIRECT_SUBSTITUTION",
                "details": "Section 105 BNS retains Part I and Part II distinctions of Section 304 IPC.",
                "litigator_warning": "In Section 103 BNS murder trials, build alternate defense under Section 105 BNS invoking sudden fight exception.",
            }
        ],
    },
    {
        "id": "ipc_304a_bns_106",
        "old_code": "IPC",
        "old_section": "304A",
        "old_title": "Causing death by negligence",
        "new_code": "BNS",
        "new_section": "106(1) / 106(2)",
        "new_title": "Causing death by negligence",
        "category": "SUBSTANTIVE",
        "concept_doctrine": "Criminal Negligence, Medical Malpractice & Hit-and-Run Escalation",
        "doctrine_summary": (
            "Causing death of any person by doing any rash or negligent act not amounting to culpable homicide. "
            "Section 106(2) BNS introduces severe hit-and-run penalty of up to 10 years if offender escapes without reporting."
        ),
        "landmark_precedents": [
            {
                "title": "Jacob Mathew v. State of Punjab",
                "citation": "(2005) 6 SCC 1",
                "court": "Supreme Court of India",
                "ratio": "Gross negligence standard for medical professionals under Section 304A IPC; simple lack of care is not criminal negligence.",
            },
            {
                "title": "Syed Akbar v. State of Karnataka",
                "citation": "(1980) 1 SCC 30",
                "court": "Supreme Court of India",
                "ratio": "Res ipsa loquitur does not strictly apply to criminal trials under Section 304A; culpable rashness must be proved by affirmative evidence.",
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 106(1) BNS Enhanced Penalty for Negligent Acts",
                "delta_type": "PENALTY_ENHANCED",
                "details": "General negligence punishment increased from 2 years (IPC) to 5 years (BNS), with 2-year cap for registered medical practitioners.",
                "litigator_warning": "Doctors are protected by the 2-year cap and Jacob Mathew guidelines under Section 106(1) proviso.",
            },
            {
                "provision_name": "Section 106(2) BNS 10-Year Hit-and-Run Offence",
                "delta_type": "NEW_PROVISO_ADDED",
                "details": "If driver escapes without reporting to police officer or Magistrate soon after the incident, imprisonment up to 10 years and fine.",
                "litigator_warning": "Check enforcement notification: Section 106(2) BNS implementation was deferred pending stakeholder consultations.",
            },
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
        "concept_doctrine": "Dowry Death & Statutory Presumption Trigger",
        "doctrine_summary": (
            "Death of a woman caused by burns or bodily injury or occurring otherwise than under normal circumstances "
            "within seven years of marriage, where it is shown that soon before death she was subjected to cruelty or harassment for dowry."
        ),
        "landmark_precedents": [
            {
                "title": "Satbir Singh v. State of Haryana",
                "citation": "(2021) 6 SCC 1",
                "court": "Supreme Court of India",
                "ratio": "'Soon before death' does not mean 'immediately before'; it means there must be a proximate and live link between cruelty for dowry and death.",
            },
            {
                "title": "Kans Raj v. State of Punjab",
                "citation": "(2000) 5 SCC 207",
                "court": "Supreme Court of India",
                "ratio": "Prosecution must establish four essential ingredients before statutory presumption under Section 113B IEA (now Section 118 BSA) can be invoked.",
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 80 BNS Dowry Death",
                "delta_type": "DIRECT_SUBSTITUTION",
                "details": "Section 80 BNS maintains the 7-year marriage timeline and minimum 7-year to life sentence.",
                "litigator_warning": "Sever the 'soon before death' proximate link to defeat the statutory presumption under Section 118 BSA.",
            }
        ],
    },
    {
        "id": "ipc_307_bns_109",
        "old_code": "IPC",
        "old_section": "307",
        "old_title": "Attempt to murder",
        "new_code": "BNS",
        "new_section": "109",
        "new_title": "Attempt to murder",
        "category": "SUBSTANTIVE",
        "concept_doctrine": "Attempt to Murder & Proof of Intention vs Extent of Injury",
        "doctrine_summary": (
            "Whoever does any act with such intention or knowledge and under such circumstances that, if he by that act "
            "caused death, he would be guilty of murder."
        ),
        "landmark_precedents": [
            {
                "title": "State of Maharashtra v. Balram Bama Patil",
                "citation": "(1983) 2 SCC 28",
                "court": "Supreme Court of India",
                "ratio": "To justify conviction under Section 307, it is not essential that bodily injury capable of causing death should have been inflicted; intention or knowledge is paramount.",
            },
            {
                "title": "Hari Kishan v. Sukhbir Singh",
                "citation": "(1988) 4 SCC 551",
                "court": "Supreme Court of India",
                "ratio": "Under Section 307, court must see whether the act, irrespective of result, was done with intention or knowledge and under circumstances mentioned in the section.",
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 109 BNS Attempt to Murder",
                "delta_type": "DIRECT_SUBSTITUTION",
                "details": "Section 109 BNS directly transposes Section 307 IPC.",
                "litigator_warning": "Argue lack of intention or knowledge from nature of weapon, single blow, or absence of vital organ injury to seek downgrade to simple hurt.",
            }
        ],
    },
    {
        "id": "ipc_319_326_bns_114_118",
        "old_code": "IPC",
        "old_section": "319-326",
        "old_title": "Hurt, Grievous Hurt, and Voluntarily Causing Hurt by Dangerous Weapons",
        "new_code": "BNS",
        "new_section": "114-118",
        "new_title": "Hurt, Grievous Hurt, and causing hurt by dangerous weapons",
        "category": "SUBSTANTIVE",
        "concept_doctrine": "Bodily Hurt Classification & Dangerous Weapons Enhancement",
        "doctrine_summary": (
            "Classification of bodily harm: simple hurt (S. 114/115 BNS), grievous hurt (S. 116/117 BNS - fracture, privation, 20 days severe pain), "
            "and hurt/grievous hurt by dangerous weapons (S. 118 BNS)."
        ),
        "landmark_precedents": [
            {
                "title": "Rambaran Mahton v. State of Bihar",
                "citation": "AIR 1958 Pat 452",
                "court": "High Court",
                "ratio": "Medical opinion is crucial to substantiate grievous hurt; mere assertion of fracture without X-ray plate is fatal to Section 325/326 charge.",
            }
        ],
        "statutory_deltas": [
            {
                "provision_name": "Sections 115-118 BNS Hurt Re-numbering",
                "delta_type": "DIRECT_SUBSTITUTION",
                "details": "IPC 323 -> BNS 115(2); IPC 324 -> BNS 118(1); IPC 325 -> BNS 117(2); IPC 326 -> BNS 118(2).",
                "litigator_warning": "Demand production of primary radiological evidence; absent X-ray plate, charge under S. 117/118 BNS must be downgraded to S. 115 BNS.",
            }
        ],
    },
    {
        "id": "ipc_354_bns_74",
        "old_code": "IPC",
        "old_section": "354",
        "old_title": "Assault or criminal force to woman with intent to outrage her modesty",
        "new_code": "BNS",
        "new_section": "74",
        "new_title": "Assault or criminal force to woman with intent to outrage her modesty",
        "category": "SUBSTANTIVE",
        "concept_doctrine": "Outraging Modesty of Woman & Objective Test of Decency",
        "doctrine_summary": (
            "Whoever assaults or uses criminal force to any woman, intending to outrage or knowing it to be likely "
            "that he will thereby outrage her modesty."
        ),
        "landmark_precedents": [
            {
                "title": "State of Punjab v. Major Singh",
                "citation": "AIR 1967 SC 63",
                "court": "Supreme Court of India",
                "ratio": "The essence of a woman's modesty is her sex. Culpable intention or knowledge of outraging modesty is the defining ingredient.",
            },
            {
                "title": "Rupan Deol Bajaj v. K.P.S. Gill",
                "citation": "(1995) 6 SCC 194",
                "court": "Supreme Court of India",
                "ratio": "The test of outraging modesty is whether the act shocked the sense of decency of a woman.",
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 74 BNS Outraging Modesty",
                "delta_type": "DIRECT_SUBSTITUTION",
                "details": "Section 74 BNS re-enacts Section 354 IPC with minimum 1-year and up to 5-year imprisonment.",
                "litigator_warning": "Cross-examine on exact words and physical conduct to rebut intention to outrage modesty.",
            }
        ],
    },
    {
        "id": "ipc_375_376_bns_63_64",
        "old_code": "IPC",
        "old_section": "375 / 376",
        "old_title": "Rape and punishment for rape",
        "new_code": "BNS",
        "new_section": "63 / 64",
        "new_title": "Rape and punishment for rape",
        "category": "SUBSTANTIVE",
        "concept_doctrine": "Sexual Violence, Consent Standard & False Promise to Marry Codification",
        "doctrine_summary": (
            "Definition of rape (S. 63 BNS) and mandatory minimum sentences (S. 64 BNS). BNS Section 69 introduces a "
            "distinct offence for sexual intercourse by deceitful means or false promise of marriage."
        ),
        "landmark_precedents": [
            {
                "title": "State of Punjab v. Gurmit Singh",
                "citation": "(1996) 2 SCC 384",
                "court": "Supreme Court of India",
                "ratio": "Testimony of prosecutrix in sexual offence cases does not require corroboration if it inspires confidence.",
            },
            {
                "title": "Anurag Soni v. State of Chhattisgarh",
                "citation": "(2019) 10 SCC 145",
                "court": "Supreme Court of India",
                "ratio": "Distinction between breach of promise to marry made in good faith and false promise made with deceitful intent from the inception.",
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 69 BNS Deceitful Promise of Marriage Codification",
                "delta_type": "NEW_PROVISO_ADDED",
                "details": (
                    "Section 69 BNS creates an independent penal offence: Sexual intercourse by employing deceitful means, "
                    "including false promise of employment or promotion, or marrying without intention of fulfilling, punishable up to 10 years."
                ),
                "litigator_warning": (
                    "In cases alleging sexual relations on promise of marriage, charge must now be evaluated under Section 69 BNS rather "
                    "than Section 376(2)(n) IPC."
                ),
            }
        ],
    },
    {
        "id": "ipc_378_379_bns_303",
        "old_code": "IPC",
        "old_section": "378 / 379",
        "old_title": "Theft and punishment for theft",
        "new_code": "BNS",
        "new_section": "303(1) / 303(2)",
        "new_title": "Theft and punishment for theft",
        "category": "SUBSTANTIVE",
        "concept_doctrine": "Theft, Dishonest Taking & Community Service for Petty Theft",
        "doctrine_summary": (
            "Dishonest taking of movable property out of the possession of any person without consent. "
            "BNS Section 303(2) introduces community service for first-time petty theft under Rs. 5,000."
        ),
        "landmark_precedents": [
            {
                "title": "K.N. Mehra v. State of Rajasthan",
                "citation": "AIR 1957 SC 369",
                "court": "Supreme Court of India",
                "ratio": "Taking movable property dishonestly out of another's possession even temporarily constitutes theft; permanent deprivation is not necessary.",
            }
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 303(2) BNS Community Service Proviso",
                "delta_type": "NEW_PROVISO_ADDED",
                "details": "Where the value of stolen property is less than Rs. 5,000 and accused is a first-time offender who restores property, sentence of community service may be awarded.",
                "litigator_warning": "In petty theft matters under Rs. 5,000, seek community service under Section 303(2) BNS avoiding imprisonment.",
            }
        ],
    },
    {
        "id": "ipc_383_384_bns_308",
        "old_code": "IPC",
        "old_section": "383 / 384",
        "old_title": "Extortion and punishment for extortion",
        "new_code": "BNS",
        "new_section": "308(1) / 308(2)",
        "new_title": "Extortion and punishment for extortion",
        "category": "SUBSTANTIVE",
        "concept_doctrine": "Extortion & Threat of Injury Inducing Delivery of Property",
        "doctrine_summary": (
            "Intentionally putting any person in fear of any injury and thereby dishonestly inducing the person so put "
            "in fear to deliver to any person any property or valuable security."
        ),
        "landmark_precedents": [
            {
                "title": "R.S. Nayak v. A.R. Antulay",
                "citation": "(1986) 2 SCC 716",
                "court": "Supreme Court of India",
                "ratio": "Delivery of property is essential to complete the offence of extortion; without delivery, only attempt is established.",
            }
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 308 BNS Extortion",
                "delta_type": "DIRECT_SUBSTITUTION",
                "details": "Section 308 BNS preserves Section 383/384 IPC.",
                "litigator_warning": "If property was not actually delivered under fear, argue that Section 308 BNS is not made out.",
            }
        ],
    },
    {
        "id": "ipc_390_395_bns_309_310",
        "old_code": "IPC",
        "old_section": "390 / 392 / 395",
        "old_title": "Robbery and Dacoity",
        "new_code": "BNS",
        "new_section": "309 / 310",
        "new_title": "Robbery and Dacoity",
        "category": "SUBSTANTIVE",
        "concept_doctrine": "Robbery, Dacoity & Five-Person Aggravation Threshold",
        "doctrine_summary": (
            "Theft or extortion becomes robbery if offender causes or attempts to cause death, hurt, or wrongful restraint. "
            "When five or more persons conjointly commit or attempt robbery, it is dacoity."
        ),
        "landmark_precedents": [
            {
                "title": "Raj Kumar v. State (NCT of Delhi)",
                "citation": "(2017) 11 SCC 160",
                "court": "Supreme Court of India",
                "ratio": "If number of identified participants drops below 5 on evidence, charge under Section 395 Dacoity must be converted to Section 392 Robbery.",
            }
        ],
        "statutory_deltas": [
            {
                "provision_name": "Sections 309 & 310 BNS Robbery & Dacoity",
                "delta_type": "DIRECT_SUBSTITUTION",
                "details": "IPC 392 -> BNS 309(2); IPC 395 -> BNS 310(2).",
                "litigator_warning": "If fewer than 5 persons are proved to have conjointly participated, challenge Section 310 BNS dacoity charge.",
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
        "concept_doctrine": "Entrustment of Property & Dishonest Misappropriation",
        "doctrine_summary": (
            "Being in any manner entrusted with property, dishonestly misappropriates or converts to own use that "
            "property, or dishonestly uses or disposes of it in violation of law or legal contract."
        ),
        "landmark_precedents": [
            {
                "title": "Chelloor Mankkal Narayan Ittiravi Nambudiri v. State of Travancore-Cochin",
                "citation": "AIR 1953 SC 478",
                "court": "Supreme Court of India",
                "ratio": "Prosecution must establish entrustment and dishonest conversion beyond reasonable doubt; mere failure to account is not criminal misappropriation.",
            },
            {
                "title": "Onkar Nath Mishra v. State (NCT of Delhi)",
                "citation": "(2008) 2 SCC 561",
                "court": "Supreme Court of India",
                "ratio": "Breach of contract without dishonest intention at the time of conversion does not constitute criminal breach of trust.",
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 316 BNS Criminal Breach of Trust Consolidation",
                "delta_type": "DIRECT_SUBSTITUTION",
                "details": "Section 316 BNS unifies definition (old S. 405 IPC) and punishments (old S. 406, 408, 409 IPC) into sub-clauses.",
                "litigator_warning": "Distinguish between civil breach of contract and criminal breach of trust under Section 316 BNS.",
            }
        ],
    },
    {
        "id": "ipc_409_bns_316_5",
        "old_code": "IPC",
        "old_section": "409",
        "old_title": "Criminal breach of trust by public servant, banker, merchant or agent",
        "new_code": "BNS",
        "new_section": "316(5)",
        "new_title": "Criminal breach of trust by public servant, banker, merchant or agent",
        "category": "SUBSTANTIVE",
        "concept_doctrine": "Fiduciary Breach by Public Servants & Financial Custodians",
        "doctrine_summary": (
            "Criminal breach of trust committed by a public servant, banker, merchant, factor, broker, attorney or agent, "
            "punishable with imprisonment for life, or up to ten years, and fine."
        ),
        "landmark_precedents": [
            {
                "title": "N. Bhargavan Pillai v. State of Kerala",
                "citation": "(2004) 13 SCC 217",
                "court": "Supreme Court of India",
                "ratio": "Public servant entrusted with government funds or property who fails to account is liable under Section 409 IPC.",
            }
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 316(5) BNS Fiduciary Breach",
                "delta_type": "DIRECT_SUBSTITUTION",
                "details": "Section 316(5) BNS reproduces Section 409 IPC.",
                "litigator_warning": "Challenge invocation of S. 316(5) BNS if accused does not fall within the enumerated categories of banker, merchant, or public servant.",
            }
        ],
    },
    {
        "id": "ipc_411_bns_317_2",
        "old_code": "IPC",
        "old_section": "411",
        "old_title": "Dishonestly receiving stolen property",
        "new_code": "BNS",
        "new_section": "317(2)",
        "new_title": "Dishonestly receiving stolen property",
        "category": "SUBSTANTIVE",
        "concept_doctrine": "Receiving Stolen Property & Knowledge or Reason to Believe",
        "doctrine_summary": (
            "Dishonestly receives or retains any stolen property, knowing or having reason to believe the same to be stolen property."
        ),
        "landmark_precedents": [
            {
                "title": "Trimbak v. State of M.P.",
                "citation": "AIR 1954 SC 39",
                "court": "Supreme Court of India",
                "ratio": "Prosecution must prove property was stolen, in accused's possession, and accused knew or had reason to believe it was stolen.",
            }
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 317(2) BNS Stolen Property Reception",
                "delta_type": "DIRECT_SUBSTITUTION",
                "details": "Section 317(2) BNS reproduces Section 411 IPC.",
                "litigator_warning": "Rebut presumption under Section 119 Illustration (a) BSA by showing purchase for valuable consideration.",
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
        "concept_doctrine": "Cheating, Deceptive Inducement & Fraudulent Inception",
        "doctrine_summary": (
            "Whoever cheats and thereby dishonestly induces the person deceived to deliver any property, or make/alter/destroy "
            "valuable security. Section 318(4) BNS replaces Section 420 IPC."
        ),
        "landmark_precedents": [
            {
                "title": "Hridaya Ranjan Prasad Verma v. State of Bihar",
                "citation": "(2000) 4 SCC 168",
                "court": "Supreme Court of India",
                "ratio": "Distinction between mere breach of contract and cheating depends on fraudulent intention at the inception of the transaction.",
            },
            {
                "title": "Vesa Malhotra v. State of Kerala",
                "citation": "(2015) 8 SCC 293",
                "court": "Supreme Court of India",
                "ratio": "Every civil breach of contract does not give rise to criminal cheating; criminal proceedings cannot be used as a recovery arm.",
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 318(4) BNS Direct Cheating Transposition",
                "delta_type": "DIRECT_SUBSTITUTION",
                "details": "Section 318(4) BNS preserves the verbatim language of Section 420 IPC.",
                "litigator_warning": "In Section 318(4) BNS quashing petitions under Section 528 BNSS, cite Hridaya Ranjan Prasad Verma and Vesa Malhotra.",
            }
        ],
    },
    {
        "id": "ipc_467_468_bns_338_336",
        "old_code": "IPC",
        "old_section": "467 / 468 / 471",
        "old_title": "Forgery of valuable security, Forgery for purpose of cheating, Using as genuine a forged document",
        "new_code": "BNS",
        "new_section": "338 / 336(3) / 340(2)",
        "new_title": "Forgery of valuable security, will, etc. / Forgery for purpose of cheating",
        "category": "SUBSTANTIVE",
        "concept_doctrine": "Forgery, Making False Document & Using Forged Records",
        "doctrine_summary": (
            "Making a false document or electronic record with intent to cause damage or injury. IPC 467 -> BNS 338 (life/10 years); "
            "IPC 468 -> BNS 336(3) (7 years); IPC 471 -> BNS 340(2)."
        ),
        "landmark_precedents": [
            {
                "title": "Sheila Sebastian v. R. Jawaharaj",
                "citation": "(2018) 7 SCC 581",
                "court": "Supreme Court of India",
                "ratio": "Charge of forgery cannot be sustained unless accused is proved to be the maker of the false document under Section 464 IPC (now Section 335 BNS).",
            },
            {
                "title": "Md. Ibrahim v. State of Bihar",
                "citation": "(2009) 8 SCC 751",
                "court": "Supreme Court of India",
                "ratio": "Executing a sale deed claiming property that does not belong to the seller does not constitute making a false document/forgery.",
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Sections 335, 336, 338, 340 BNS Forgery Modernization",
                "delta_type": "PROCEDURE_MODIFIED",
                "details": "Explicitly harmonizes electronic records, digital signatures, and metadata into the statutory definition of forgery.",
                "litigator_warning": "Rely on Sheila Sebastian: if prosecution cannot prove accused physically created the forged instrument, S. 338 BNS fails.",
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
        "concept_doctrine": "Matrimonial Cruelty, Harassment & Relative Implication",
        "doctrine_summary": (
            "Husband or relative of husband subjecting a woman to cruelty (willful conduct likely to drive to suicide or cause grave injury, or harassment for property)."
        ),
        "landmark_precedents": [
            {
                "title": "Preeti Gupta v. State of Jharkhand",
                "citation": "(2010) 7 SCC 667",
                "court": "Supreme Court of India",
                "ratio": "Noted alarming tendency to implicate all distant relatives of husband in matrimonial disputes without specific allegations; quashed proceedings against in-laws.",
            },
            {
                "title": "Kahkashan Kausar @ Sonam v. State of Bihar",
                "citation": "(2022) 6 SCC 599",
                "court": "Supreme Court of India",
                "ratio": "General and omnibus allegations against husband's relatives without specific role or proximate acts cannot justify putting them on trial.",
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Sections 85 & 86 BNS Split Structure",
                "delta_type": "PROCEDURE_MODIFIED",
                "details": "Section 85 BNS prescribes punishment (up to 3 years and fine) while Section 86 BNS defines cruelty.",
                "litigator_warning": "Move for quashing under Section 528 BNSS for distant in-laws if allegations under Section 85 BNS are omnibus.",
            }
        ],
    },
    {
        "id": "ipc_499_500_bns_356",
        "old_code": "IPC",
        "old_section": "499 / 500",
        "old_title": "Defamation and punishment for defamation",
        "new_code": "BNS",
        "new_section": "356(1) / 356(2)",
        "new_title": "Defamation and punishment for defamation",
        "category": "SUBSTANTIVE",
        "concept_doctrine": "Criminal Defamation, Ten Statutory Exceptions & Community Service",
        "doctrine_summary": (
            "Making or publishing any imputation concerning any person intending to harm reputation. "
            "BNS Section 356(2) introduces community service as an alternative sentencing option."
        ),
        "landmark_precedents": [
            {
                "title": "Subramanian Swamy v. Union of India",
                "citation": "(2016) 7 SCC 221",
                "court": "Supreme Court of India",
                "ratio": "Upheld constitutional validity of criminal defamation; right to reputation is protected under Article 21 and balances free speech.",
            }
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 356(2) BNS Community Service Option",
                "delta_type": "PENALTY_ENHANCED",
                "details": "Section 356(2) BNS permits sentencing a convicted defamer to community service in addition to or in lieu of simple imprisonment up to two years.",
                "litigator_warning": "Rely on First Exception (truth for public good) and Ninth Exception (private interest protection) in Section 356(1) BNS.",
            }
        ],
    },
    {
        "id": "ipc_503_506_bns_351",
        "old_code": "IPC",
        "old_section": "503 / 506",
        "old_title": "Criminal intimidation and punishment",
        "new_code": "BNS",
        "new_section": "351(1) / 351(2)",
        "new_title": "Criminal intimidation and punishment",
        "category": "SUBSTANTIVE",
        "concept_doctrine": "Criminal Intimidation & Real Threat vs Empty Words",
        "doctrine_summary": (
            "Threatening another with injury to person, reputation or property with intent to cause alarm or cause "
            "them to do any act which they are not legally bound to do."
        ),
        "landmark_precedents": [
            {
                "title": "Vikram Johar v. State of U.P.",
                "citation": "(2019) 14 SCC 207",
                "court": "Supreme Court of India",
                "ratio": "Mere abuse, discourtesy or empty threats do not amount to criminal intimidation; there must be real threat of injury intended to cause alarm.",
            }
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 351 BNS Criminal Intimidation",
                "delta_type": "DIRECT_SUBSTITUTION",
                "details": "Section 351 BNS consolidates Section 503 and Section 506 IPC.",
                "litigator_warning": "Move for discharge if the alleged threat caused no actual alarm or intent to compel conduct.",
            }
        ],
    },

    # =========================================================================
    # IEA ⇄ BSA (Evidentiary Framework)
    # =========================================================================
    {
        "id": "iea_3_bsa_2",
        "old_code": "IEA",
        "old_section": "3",
        "old_title": "Interpretation clause (Evidence, Document, Fact, Proved, Disproved)",
        "new_code": "BSA",
        "new_section": "2",
        "new_title": "Definitions (Document, Evidence, Fact, Proved, Disproved)",
        "category": "EVIDENTIARY",
        "concept_doctrine": "Evidentiary Definitions & Complete Digital Document Equivalence",
        "doctrine_summary": (
            "Foundational statutory definitions governing admissibility. BSA Section 2(1)(d) fundamentally redefines 'document' "
            "to comprehensively include electronic records, digital communications, server logs, cloud storage, and messages."
        ),
        "landmark_precedents": [
            {
                "title": "Anvar P.V. v. P.K. Basheer",
                "citation": "(2014) 10 SCC 473",
                "court": "Supreme Court of India",
                "ratio": "Electronic records require special certificate proof; documentary evidence rules under general provisions are subject to electronic admissibility regimes.",
            }
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 2(1)(d) BSA Comprehensive Digital Document Definition",
                "delta_type": "SUBSTANTIAL_CHANGE",
                "details": "Digital records, emails, messages, server logs, and electronic files are explicitly placed on equal footing with physical documents.",
                "litigator_warning": "Any digital output tendered by the prosecution must comply with Section 63 BSA authentication.",
            }
        ],
    },
    {
        "id": "iea_6_8_bsa_4_6",
        "old_code": "IEA",
        "old_section": "6, 7, 8",
        "old_title": "Relevancy of facts forming part of same transaction (Res Gestae), Occasion, Motive, Preparation, Conduct",
        "new_code": "BSA",
        "new_section": "4, 5, 6",
        "new_title": "Relevancy of facts forming part of same transaction, Occasion, Motive, Preparation, Conduct",
        "category": "EVIDENTIARY",
        "concept_doctrine": "Res Gestae & Spontaneous Utterances",
        "doctrine_summary": (
            "Facts which, though not in issue, are so connected with a fact in issue as to form part of the same transaction "
            "are relevant (Res Gestae), whether they occurred at the same time and place or at different times and places."
        ),
        "landmark_precedents": [
            {
                "title": "Gentela Vijayavardhan Rao v. State of A.P.",
                "citation": "(1996) 6 SCC 241",
                "court": "Supreme Court of India",
                "ratio": "Res gestae statements must be substantially contemporaneous with the fact in issue without opportunity for fabrication or tutoring.",
            }
        ],
        "statutory_deltas": [
            {
                "provision_name": "Sections 4, 5, 6 BSA Res Gestae & Conduct",
                "delta_type": "DIRECT_SUBSTITUTION",
                "details": "Sections 4, 5, 6 BSA preserve Sections 6, 7, 8 IEA.",
                "litigator_warning": "Challenge res gestae claims if there was a time gap permitting concoction.",
            }
        ],
    },
    {
        "id": "iea_9_bsa_7",
        "old_code": "IEA",
        "old_section": "9",
        "old_title": "Facts necessary to explain or introduce relevant facts (Test Identification Parade)",
        "new_code": "BSA",
        "new_section": "7",
        "new_title": "Facts necessary to explain or introduce relevant facts",
        "category": "EVIDENTIARY",
        "concept_doctrine": "Test Identification Parade (TIP) & Substantive Court Identification",
        "doctrine_summary": (
            "Facts establishing identity of anything or person whose identity is relevant. Test Identification Parade "
            "is an investigative corroboration step; substantive identification is made in court."
        ),
        "landmark_precedents": [
            {
                "title": "Heera v. State of Rajasthan",
                "citation": "(2007) 10 SCC 175",
                "court": "Supreme Court of India",
                "ratio": "Failure to hold TIP does not make court identification inadmissible, but TIP assures that investigation is proceeding in the right direction.",
            }
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 7 BSA Identification",
                "delta_type": "DIRECT_SUBSTITUTION",
                "details": "Section 7 BSA directly transposes Section 9 IEA.",
                "litigator_warning": "If accused was shown to witness at police station prior to TIP, identification is tainted.",
            }
        ],
    },
    {
        "id": "iea_24_26_bsa_22_23",
        "old_code": "IEA",
        "old_section": "24, 25, 26",
        "old_title": "Confession caused by inducement, Confession to police officer, Confession in police custody",
        "new_code": "BSA",
        "new_section": "22, 23(1), 23(2)",
        "new_title": "Confession caused by inducement, threat or promise / Confession to police officer",
        "category": "EVIDENTIARY",
        "concept_doctrine": "Inadmissibility of Police Confessions & Custodial Coercion Bar",
        "doctrine_summary": (
            "No confession made to a police officer shall be proved as against a person accused of any offence. "
            "No confession made by any person whilst in police custody shall be proved unless made before a Magistrate."
        ),
        "landmark_precedents": [
            {
                "title": "Aghnoo Nagesia v. State of Bihar",
                "citation": "AIR 1966 SC 119",
                "court": "Supreme Court of India",
                "ratio": "Ban under Section 25 IEA on confession to police officer is absolute and applies to the entire confession except the discrete discovery fact.",
            },
            {
                "title": "Indra Dalal v. State of Haryana",
                "citation": "(2015) 11 SCC 31",
                "court": "Supreme Court of India",
                "ratio": "Philosophy behind exclusion of police confessions is to prevent torture and fabrication of evidence in police custody.",
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 23 BSA Inadmissibility of Police Confessions",
                "delta_type": "DIRECT_SUBSTITUTION",
                "details": "Section 23 BSA consolidates Section 25, 26 and 27 IEA into a single comprehensive provision.",
                "litigator_warning": "Object to any confessional disclosure statements admitted on record outside the strict S. 23(2) proviso.",
            }
        ],
    },
    {
        "id": "iea_27_bsa_23",
        "old_code": "IEA",
        "old_section": "27",
        "old_title": "How much of information received from accused may be proved (Discovery of Fact)",
        "new_code": "BSA",
        "new_section": "23(2) Proviso",
        "new_title": "Confession to police officer not to be proved (Proviso on Discovery)",
        "category": "EVIDENTIARY",
        "concept_doctrine": "Custodial Discovery Statement & Section 27 Doctrine of Confirmation",
        "doctrine_summary": (
            "When any fact is deposed to as discovered in consequence of information received from a person accused "
            "in police custody, so much of such information as relates distinctly to the fact thereby discovered may be proved."
        ),
        "landmark_precedents": [
            {
                "title": "Pulukuri Kottaya v. King Emperor",
                "citation": "AIR 1947 PC 67",
                "court": "Privy Council",
                "ratio": (
                    "Locus classicus on Section 27: 'Fact discovered' embraces the place from which the object is produced "
                    "and the knowledge of the accused as to this, and the information given must relate distinctly to this fact. "
                    "Past history or confession of guilt cannot be admitted under the guise of discovery."
                ),
            },
            {
                "title": "Boby v. State of Kerala",
                "citation": "2023 SCC OnLine SC 50",
                "court": "Supreme Court of India",
                "ratio": "Discovery under Section 27 is inadmissible if the recovery place was an open space accessible to the public, or if independent witnesses were not associated.",
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 23(2) Proviso BSA Consolidation with S. 105 BNSS Videography",
                "delta_type": "PROCEDURE_MODIFIED",
                "details": (
                    "Section 27 IEA is now codified as the Proviso to Section 23(2) BSA. Crucially, it must now be read in "
                    "conjunction with Section 105 BNSS, requiring mandatory audio-video recording of the seizure memo."
                ),
                "litigator_warning": (
                    "DEFENSE STRATEGY: Any weapon/object recovery under S. 23(2) BSA proviso must be backed by a Section 105 BNSS "
                    "video recording and Section 63 BSA certificate. Challenge unrecorded recoveries."
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
        "new_section": "26(a)",
        "new_title": "Statements by persons who cannot be called as witnesses (Dying Declaration)",
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
                "ratio": "Medical certificate of fitness is a rule of caution, but if magistrate or person recording is satisfied that declarant was in a fit mental state, declaration can be acted upon.",
            },
            {
                "title": "Purshottam Chopra v. State (NCT of Delhi)",
                "citation": "(2020) 11 SCC 489",
                "court": "Supreme Court of India",
                "ratio": "A dying declaration can form the sole basis of conviction if it inspires full confidence; suspicious circumstances require corroboration.",
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 26(a) BSA Dying Declaration",
                "delta_type": "DIRECT_SUBSTITUTION",
                "details": "Section 26(a) BSA directly replicates Section 32(1) IEA.",
                "litigator_warning": "Probe electronic recording under Section 105/183 BNSS if dying declaration was recorded on camera.",
            }
        ],
    },
    {
        "id": "iea_45_bsa_39",
        "old_code": "IEA",
        "old_section": "45",
        "old_title": "Opinions of experts",
        "new_code": "BSA",
        "new_section": "39",
        "new_title": "Opinions of experts",
        "category": "EVIDENTIARY",
        "concept_doctrine": "Expert Scientific Testimony & Cyber Forensics",
        "doctrine_summary": (
            "When the court has to form an opinion upon a point of foreign law or of science or art, or identity of handwriting "
            "or finger impressions, the opinions upon that point of persons specially skilled are relevant. BSA expands to cyber and digital forensics."
        ),
        "landmark_precedents": [
            {
                "title": "Ramesh Chandra Agrawal v. Regency Hospital Ltd.",
                "citation": "(2009) 9 SCC 709",
                "court": "Supreme Court of India",
                "ratio": "Expert opinion is only advisory; the court is not bound by it and must evaluate the scientific reasoning supporting the conclusion.",
            }
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 39 BSA Cyber Forensics Expansion",
                "delta_type": "SUBSTANTIAL_CHANGE",
                "details": "Section 39 BSA explicitly broadens expert opinion to include cyber and digital forensics examinations.",
                "litigator_warning": "Demand examiner of electronic evidence certification under Section 79A IT Act alongside Section 39 BSA.",
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
            "Information contained in an electronic record printed on paper, stored, recorded or copied shall be deemed "
            "a document and admissible if conditions are met. Section 63 BSA mandates certificate signed by person in charge."
        ),
        "landmark_precedents": [
            {
                "title": "Arjun Panditrao Khotkar v. Kailash Kushanrao Gorantyal",
                "citation": "(2020) 7 SCC 1",
                "court": "Supreme Court of India",
                "ratio": (
                    "Section 65B(4) certificate is a condition precedent to the admissibility of secondary electronic evidence. "
                    "Oral evidence cannot substitute certificate. Required at trial stage."
                ),
            },
            {
                "title": "State of Karnataka v. T. Naseer @ Nasir",
                "citation": "(2023) 4 SCC 140",
                "court": "Supreme Court of India",
                "ratio": "Certificate under Section 65B can be produced at any stage prior to completion of trial.",
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 63 BSA Structured Certificate Schedule",
                "delta_type": "PROCEDURE_MODIFIED",
                "details": (
                    "Section 63 BSA incorporates an explicit statutory Schedule form for electronic certificate authentication, "
                    "mandating cryptographic hash value specification (e.g. SHA-256) and chain of custody documentation."
                ),
                "litigator_warning": (
                    "Inspect Section 63 BSA certificates for cryptographic hash values. If the hash value is missing, "
                    "object immediately to exclusion of CDRs, WhatsApp chats, and CCTV footage."
                ),
            }
        ],
    },
    {
        "id": "iea_101_104_bsa_104_107",
        "old_code": "IEA",
        "old_section": "3 / 101-104",
        "old_title": "Burden of proof and Circumstantial Evidence",
        "new_code": "BSA",
        "new_section": "2 / 104-107",
        "new_title": "Burden of proof",
        "category": "EVIDENTIARY",
        "concept_doctrine": "Burden of Proof & Circumstantial Evidence Panchsheel",
        "doctrine_summary": (
            "Whoever desires any court to give judgment as to any legal right dependent on the existence of facts "
            "which he asserts, must prove that those facts exist. In circumstantial evidence, the five golden principles govern."
        ),
        "landmark_precedents": [
            {
                "title": "Sharad Birdhichand Sarda v. State of Maharashtra",
                "citation": "(1984) 4 SCC 116",
                "court": "Supreme Court of India",
                "ratio": (
                    "Laid down the five golden principles (Panchsheel) of circumstantial evidence: circumstances from which "
                    "inference of guilt is drawn must be fully established; facts must be consistent only with guilt and "
                    "exclude every hypothesis of innocence."
                ),
            },
            {
                "title": "Hanumant v. State of M.P.",
                "citation": "AIR 1952 SC 343",
                "court": "Supreme Court of India",
                "ratio": "There must be a chain of evidence so complete as not to leave any reasonable ground for conclusion consistent with innocence.",
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Sections 104-107 BSA Burden of Proof",
                "delta_type": "DIRECT_SUBSTITUTION",
                "details": "Sections 104-107 BSA replicate Sections 101-104 IEA.",
                "litigator_warning": "Where prosecution relies on CDR, tower location, or CCTV circumstantial links, cross-reference with Section 63 BSA certificate.",
            }
        ],
    },
    {
        "id": "iea_106_bsa_109",
        "old_code": "IEA",
        "old_section": "106",
        "old_title": "Burden of proving fact especially within knowledge",
        "new_code": "BSA",
        "new_section": "109",
        "new_title": "Burden of proving fact especially within knowledge",
        "category": "EVIDENTIARY",
        "concept_doctrine": "Special Knowledge Burden & Last Seen Theory",
        "doctrine_summary": (
            "When any fact is especially within the knowledge of any person, the burden of proving that fact is upon him. "
            "Applies in last-seen theory only after prosecution establishes foundational facts."
        ),
        "landmark_precedents": [
            {
                "title": "Shambu Nath Mehra v. State of Ajmer",
                "citation": "AIR 1956 SC 404",
                "court": "Supreme Court of India",
                "ratio": "Section 106 cannot be used to relieve the prosecution of its primary burden of proving guilt beyond reasonable doubt.",
            },
            {
                "title": "Satpal v. State of Haryana",
                "citation": "(2018) 6 SCC 610",
                "court": "Supreme Court of India",
                "ratio": "Last seen theory comes into play where time gap between pointing of last seen and recovery of body is so small that possibility of any other person intervening is ruled out.",
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 109 BSA Special Knowledge",
                "delta_type": "DIRECT_SUBSTITUTION",
                "details": "Section 109 BSA mirrors Section 106 IEA.",
                "litigator_warning": "Rebut reverse burden: Section 109 BSA does not apply until prosecution independently establishes a proximate last-seen link.",
            }
        ],
    },
    {
        "id": "iea_113a_113b_bsa_117_118",
        "old_code": "IEA",
        "old_section": "113A / 113B",
        "old_title": "Presumption as to abetment of suicide by a married woman / Presumption as to dowry death",
        "new_code": "BSA",
        "new_section": "117 / 118",
        "new_title": "Presumption as to abetment of suicide / Presumption as to dowry death",
        "category": "EVIDENTIARY",
        "concept_doctrine": "Statutory Presumptions of Dowry Death & Matrimonial Suicide",
        "doctrine_summary": (
            "Presumption of abetment of suicide within 7 years of marriage (S. 117 BSA) and mandatory presumption of "
            "dowry death where woman was subjected to cruelty soon before death (S. 118 BSA)."
        ),
        "landmark_precedents": [
            {
                "title": "Ramesh Kumar v. State of Chhattisgarh",
                "citation": "(2001) 9 SCC 618",
                "court": "Supreme Court of India",
                "ratio": "Presumption under Section 113A is discretionary, not mandatory; court must have regard to all other circumstances before presuming abetment.",
            }
        ],
        "statutory_deltas": [
            {
                "provision_name": "Sections 117 & 118 BSA Presumptions",
                "delta_type": "DIRECT_SUBSTITUTION",
                "details": "Sections 117 & 118 BSA preserve Sections 113A & 113B IEA.",
                "litigator_warning": "To rebut Section 118 BSA presumption, demonstrate independent or personal reasons for deceased's depression.",
            }
        ],
    },
    {
        "id": "iea_114_bsa_119",
        "old_code": "IEA",
        "old_section": "114",
        "old_title": "Court may presume existence of certain facts",
        "new_code": "BSA",
        "new_section": "119",
        "new_title": "Court may presume existence of certain facts",
        "category": "EVIDENTIARY",
        "concept_doctrine": "Judicial Presumptions of Fact & Natural Human Course",
        "doctrine_summary": (
            "Court may presume the existence of any fact which it thinks likely to have happened, regard being had to the "
            "common course of natural events, human conduct and public and private business (e.g. stolen goods, accomplice testimony)."
        ),
        "landmark_precedents": [
            {
                "title": "Limbaji v. State of Maharashtra",
                "citation": "(2001) 10 SCC 340",
                "court": "Supreme Court of India",
                "ratio": "Presumption under Section 114 Illustration (a) from recent possession of stolen property does not automatically justify presumption of murder without connecting evidence.",
            }
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 119 BSA Presumptions of Fact",
                "delta_type": "DIRECT_SUBSTITUTION",
                "details": "Section 119 BSA maintains Section 114 IEA illustrations.",
                "litigator_warning": "Rebut Illustration (a) presumption by showing plausible explanation of possession.",
            }
        ],
    },
    {
        "id": "iea_145_bsa_148",
        "old_code": "IEA",
        "old_section": "145",
        "old_title": "Cross-examination as to previous statements in writing",
        "new_code": "BSA",
        "new_section": "148",
        "new_title": "Cross-examination as to previous statements in writing",
        "category": "EVIDENTIARY",
        "concept_doctrine": "Contradiction & Impeaching Witness Credit",
        "doctrine_summary": (
            "A witness may be cross-examined as to previous statements made by him in writing or reduced into writing, "
            "and his attention must be called to those parts which are to be used for the purpose of contradicting him."
        ),
        "landmark_precedents": [
            {
                "title": "Tahsildar Singh v. State of U.P.",
                "citation": "AIR 1959 SC 1012",
                "court": "Supreme Court of India (Constitution Bench)",
                "ratio": "Strict procedure for proving contradictions: witness must be confronted with the specific portion of Section 161 statement; statement proved through investigating officer.",
            },
            {
                "title": "V.K. Mishra v. State of Uttarakhand",
                "citation": "(2015) 9 SCC 588",
                "court": "Supreme Court of India",
                "ratio": "A previous statement can be used for contradiction only after drawing the attention of the witness to that specific passage.",
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 148 BSA Contradiction Procedure",
                "delta_type": "DIRECT_SUBSTITUTION",
                "details": "Section 148 BSA preserves the Section 145 IEA contradiction regime.",
                "litigator_warning": "Mark contradictions formally on the record during witness testimony; without confrontation, contradiction cannot be argued.",
            }
        ],
    },
    {
        "id": "iea_154_bsa_157",
        "old_code": "IEA",
        "old_section": "154",
        "old_title": "Question by party to his own witness (Hostile Witness)",
        "new_code": "BSA",
        "new_section": "157",
        "new_title": "Question by party to his own witness",
        "category": "EVIDENTIARY",
        "concept_doctrine": "Hostile Witness & Cross-Examination by Calling Party",
        "doctrine_summary": (
            "Court may permit the party who calls a witness to put any questions to him which might be put in cross-examination. "
            "Testimony of a hostile witness is not entirely effaced and may be relied on to the extent corroborated."
        ),
        "landmark_precedents": [
            {
                "title": "Sat Paul v. Delhi Administration",
                "citation": "(1976) 1 SCC 727",
                "court": "Supreme Court of India",
                "ratio": "Evidence of a hostile witness does not stand washed away; that part of the testimony which is consistent with the case of either party can be accepted.",
            },
            {
                "title": "Neeraj Dutta v. State (Govt. of NCT of Delhi)",
                "citation": "(2023) 4 SCC 731",
                "court": "Supreme Court of India (Constitution Bench)",
                "ratio": "Even if complainant turns hostile, demand and acceptance of illegal gratification can be proved through circumstantial evidence.",
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 157 BSA Hostile Witness",
                "delta_type": "DIRECT_SUBSTITUTION",
                "details": "Section 157 BSA mirrors Section 154 IEA.",
                "litigator_warning": "Defense can rely on admissions made by hostile prosecution witnesses in cross-examination.",
            }
        ],
    },
]

print(f"Total compiled pairs: {len(DATA)}")

# Validate each pair using Pydantic model
errors = []
for i, item in enumerate(DATA):
    try:
        StatuteConcordancePair.model_validate(item)
    except Exception as e:
        errors.append((i, item.get("id"), str(e)))

if errors:
    print(f"Validation errors found: {len(errors)}")
    for err in errors:
        print(err)
    sys.exit(1)

print("All pairs validated successfully against StatuteConcordancePair schema!")

# Write file content for criminal_statutes_concordance.py
target_file = Path(__file__).parent.parent / "app" / "data" / "criminal_statutes_concordance.py"

header = '''"""Criminal Statutes Concordance Knowledge Base.

Authoritative bi-directional mappings across the Indian Criminal Law eras:
1. Legacy Codes: Indian Penal Code 1860 (IPC), Code of Criminal Procedure 1973 (CrPC), Indian Evidence Act 1872 (IEA)
2. New Codes: Bharatiya Nyaya Sanhita 2023 (BNS), Bharatiya Nagarik Suraksha Sanhita 2023 (BNSS), Bharatiya Sakshya Adhiniyam 2023 (BSA)

Enforced on 1 July 2024.
"""

from __future__ import annotations

from typing import Any

CRIMINAL_CONCORDANCE_DATA: list[dict[str, Any]] = '''

footer = '''

def get_all_concordance_pairs() -> list[dict[str, Any]]:
    """Return complete database of concordance mappings."""
    return CRIMINAL_CONCORDANCE_DATA
'''

import pprint
formatted_data = pprint.pformat(DATA, indent=4, width=120, sort_dicts=False)

with open(target_file, "w", encoding="utf-8") as f:
    f.write(header + formatted_data + footer)

print(f"Successfully wrote {len(DATA)} concordance pairs to {target_file}")
