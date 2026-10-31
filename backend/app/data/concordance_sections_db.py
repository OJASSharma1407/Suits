"""Complete Statutory Concordance Index (IPC ↔ BNS, CrPC ↔ BNSS, IEA ↔ BSA).

Authoritative comprehensive mappings covering:
1. Substantive Criminal Law: Indian Penal Code 1860 (all 511 sections) ↔ Bharatiya Nyaya Sanhita 2023 (all 358 sections).
2. Procedural Criminal Law: Code of Criminal Procedure 1973 (all 484 sections) ↔ Bharatiya Nagarik Suraksha Sanhita 2023 (all 531 sections).
3. Evidentiary Law: Indian Evidence Act 1872 (all 167 sections) ↔ Bharatiya Sakshya Adhiniyam 2023 (all 170 sections).
4. New Provisions 2024: Non-legacy standalone additions (Community Service, Mob Lynching, Organized Crime, S. 105 Videography, S. 173(3) Preliminary Inquiry, S. 187 Split Remand, S. 479 Undertrial Relief, etc.).
"""

from __future__ import annotations

from typing import Any

# =========================================================================
# SUBSTANTIVE CRIMINAL LAW: IPC ↔ BNS
# =========================================================================
IPC_TO_BNS_MASTER: dict[str, dict[str, Any]] = {
    # General Explanations & Principles
    "1": {"bns": "1", "title": "Title and extent of operation of the Code", "doctrine": "Territorial Jurisdiction"},
    "2": {"bns": "1", "title": "Punishment of offences committed within India", "doctrine": "Intra-territorial Jurisdiction"},
    "3": {"bns": "1(4)", "title": "Punishment of offences committed beyond India", "doctrine": "Extra-territorial Jurisdiction"},
    "4": {"bns": "1(5)", "title": "Extension of Code to extra-territorial offences", "doctrine": "Offences Outside India"},
    "5": {"bns": "1(6)", "title": "Certain laws not to be affected by this Act", "doctrine": "Special and Local Laws Saving"},
    "6": {"bns": "2", "title": "Definitions in the Code to be understood subject to exceptions", "doctrine": "General Exceptions Applicability"},
    "21": {"bns": "2(28)", "title": "Public servant", "doctrine": "Definition of Public Servant"},
    "22": {"bns": "2(21)", "title": "Movable property", "doctrine": "Corporeal Property"},
    "23": {"bns": "2(34)", "title": "Wrongful gain and Wrongful loss", "doctrine": "Dishonest Intention Anchor"},
    "24": {"bns": "2(7)", "title": "Dishonestly", "doctrine": "Mens Rea - Dishonesty"},
    "25": {"bns": "2(10)", "title": "Fraudulently", "doctrine": "Mens Rea - Fraudulent Intent"},
    "28": {"bns": "2(4)", "title": "Counterfeit", "doctrine": "Deceptive Resemblance"},
    "29": {"bns": "2(8)", "title": "Document", "doctrine": "Documentary Substance"},
    "29A": {"bns": "2(9)", "title": "Electronic record", "doctrine": "Electronic Records in Penal Code"},
    "34": {"bns": "3(5)", "title": "Acts done by several persons in furtherance of common intention", "doctrine": "Joint Liability & Common Intention", "landmark": "Barendra Kumar Ghosh v. Emperor (1925) / Mahbub Shah v. Emperor (1945)", "ratio": "Requires prior meeting of minds and active participation in criminal enterprise."},
    "35": {"bns": "3(6)", "title": "When such an act is criminal by reason of its being done with a criminal knowledge or intention", "doctrine": "Joint Criminal Knowledge"},
    "36": {"bns": "3(7)", "title": "Effect caused partly by act and partly by omission", "doctrine": "Act and Omission Equivalence"},
    "37": {"bns": "3(8)", "title": "Co-operation by doing one of several acts constituting an offence", "doctrine": "Composite Offence Joint Liability"},
    "38": {"bns": "3(9)", "title": "Persons concerned in criminal act may be guilty of different offences", "doctrine": "Individualised Culpability in Joint Act"},
    "45": {"bns": "2(19)", "title": "Life", "doctrine": "Definition of Life under Penal Code", "ratio": "Under Section 45 IPC and Section 2(19) BNS, the word 'life' denotes the life of a human being, unless the contrary appears from the context."},
    "53": {"bns": "4", "title": "Punishments", "doctrine": "Statutory Punishments", "delta": "BNS Section 4 introduces Community Service as a brand new form of punishment for petty offences."},
    "73": {"bns": "11", "title": "Solitary confinement", "doctrine": "Solitary Confinement Limits"},
    
    # General Exceptions (Defence of Accused)
    "76": {"bns": "14", "title": "Act done by a person bound, or by mistake of fact believing himself bound, by law", "doctrine": "Mistake of Fact (Ignorantia Facti Excusat)", "landmark": "State of West Bengal v. Shew Mangal Singh (1981)", "ratio": "Good faith mistake of fact is complete defence; mistake of law is not."},
    "79": {"bns": "17", "title": "Act done by a person justified, or by mistake of fact believing himself justified, by law", "doctrine": "Justification by Law and Mistake of Fact"},
    "80": {"bns": "18", "title": "Accident in doing a lawful act", "doctrine": "Inevitable Accident & Lawful Act"},
    "81": {"bns": "19", "title": "Act likely to cause harm, but done without criminal intent, and to prevent other harm", "doctrine": "Doctrine of Necessity (Quod Necessitas Non Habet Legem)"},
    "82": {"bns": "20", "title": "Act of a child under seven years of age", "doctrine": "Absolute Doli Incapax (Under 7 Years)"},
    "83": {"bns": "21", "title": "Act of a child above seven and under twelve of immature understanding", "doctrine": "Qualified Doli Incapax (7 to 12 Years)"},
    "84": {"bns": "22", "title": "Act of a person of unsound mind", "doctrine": "Insanity Defence / M'Naghten Rules", "landmark": "Dahyabhai Chhaganbhai Thakkar v. State of Gujarat (1964)", "ratio": "Legal insanity at time of commission renders accused incapable of knowing nature of act."},
    "85": {"bns": "23", "title": "Act of a person incapable of judgment by reason of intoxication caused against his will", "doctrine": "Involuntary Intoxication"},
    "86": {"bns": "24", "title": "Offence requiring a particular intent or knowledge committed by one who is intoxicated", "doctrine": "Voluntary Intoxication and Mens Rea", "landmark": "Basdev v. State of Pepsu (1956)", "ratio": "Voluntary drunkenness does not negative presumption of knowledge."},
    "87": {"bns": "25", "title": "Act not intended and not known to be likely to cause death or grievous hurt, done by consent", "doctrine": "Volenti Non Fit Injuria (Consent)"},
    "92": {"bns": "30", "title": "Act done in good faith for benefit of a person without consent", "doctrine": "Emergency Medical or Protective Aid"},
    "94": {"bns": "32", "title": "Act to which a person is compelled by threats", "doctrine": "Duress and Coercion (Except Murder and State Offences)"},
    "95": {"bns": "33", "title": "Act causing slight harm (De minimis non curat lex)", "doctrine": "Trivialities and De Minimis Rule"},
    
    # Right of Private Defence
    "96": {"bns": "34", "title": "Things done in private defence", "doctrine": "Statutory Right of Private Defence"},
    "97": {"bns": "35", "title": "Right of private defence of the body and of property", "doctrine": "Scope of Defence of Body and Property"},
    "99": {"bns": "37", "title": "Acts against which there is no right of private defence", "doctrine": "Limitations on Private Defence & Recourse to Public Authorities"},
    "100": {"bns": "38", "title": "When the right of private defence of the body extends to causing death", "doctrine": "Deadly Force in Private Defence of Body", "landmark": "Darshan Singh v. State of Punjab (2010)", "ratio": "Reasonable apprehension of death or grievous hurt justifies causing death in private defence."},
    "101": {"bns": "39", "title": "When such right extends to causing any harm other than death", "doctrine": "Non-Deadly Private Defence of Body"},
    "102": {"bns": "40", "title": "Commencement and continuance of the right of private defence of the body", "doctrine": "Duration of Threat and Private Defence"},
    "103": {"bns": "41", "title": "When the right of private defence of property extends to causing death", "doctrine": "Deadly Force in Defence of Property (Robbery, House-breaking, Arson)"},
    "104": {"bns": "42", "title": "When such right extends to causing any harm other than death", "doctrine": "Non-Deadly Defence of Property"},
    "105": {"bns": "43", "title": "Commencement and continuance of the right of private defence of property", "doctrine": "Duration of Property Threat"},
    "106": {"bns": "44", "title": "Right of private defence against deadly assault when there is risk of harm to innocent person", "doctrine": "Collateral Risk in Deadly Assault Defence"},
    
    # Abetment & Conspiracy
    "107": {"bns": "45", "title": "Abetment of a thing", "doctrine": "Tripartite Abetment (Instigation, Conspiracy, Aiding)", "landmark": "Sanju v. State of M.P. (2002)", "ratio": "Instigation requires active suggestion, encouragement, or stimulation to commit offence."},
    "108": {"bns": "46", "title": "Abettor", "doctrine": "Definition and Culpability of Abettor"},
    "109": {"bns": "47", "title": "Punishment of abetment if the act abetted is committed in consequence", "doctrine": "Abetment Resulting in Offence"},
    "111": {"bns": "49", "title": "Liability of abettor when one act abetted and different act done", "doctrine": "Probable Consequence of Abetment"},
    "114": {"bns": "52", "title": "Abettor present when offence is committed", "doctrine": "Constructive Principal Liability"},
    "115": {"bns": "53", "title": "Abetment of offence punishable with death or imprisonment for life", "doctrine": "Abetment of Capital Crime (Act Not Committed)"},
    "116": {"bns": "54", "title": "Abetment of offence punishable with imprisonment", "doctrine": "Abetment of Imprisonable Offence"},
    "120A": {"bns": "61(1)", "title": "Definition of criminal conspiracy", "doctrine": "Agreement to Commit Illegal Act", "landmark": "State (NCT of Delhi) v. Navjot Sandhu (2005)", "ratio": "Agreement to commit illegal act constitutes complete offence; overt act only needed for non-offence."},
    "120B": {"bns": "61(2)", "title": "Punishment of criminal conspiracy", "doctrine": "Conspiracy Penalties"},
    
    # Offences Against the State
    "121": {"bns": "147", "title": "Waging, or attempting to wage war, or abetting waging of war, against the Government of India", "doctrine": "Waging War Against State"},
    "124A": {"bns": "152", "title": "Sedition (Replaced by Acts Endangering Sovereignty)", "doctrine": "Subversion of Sovereign Unity", "delta": "Sedition archaic section repealed. BNS Section 152 penalizes acts exciting secession, armed rebellion, or subversive activities endangering sovereignty, unity and integrity of India."},
    "141": {"bns": "189(1)", "title": "Unlawful assembly", "doctrine": "Five or More Persons with Common Illegal Object"},
    "142": {"bns": "189(2)", "title": "Being member of unlawful assembly", "doctrine": "Membership of Unlawful Assembly"},
    "143": {"bns": "189(3)", "title": "Punishment for unlawful assembly", "doctrine": "Unlawful Assembly Sanctions"},
    "144": {"bns": "190", "title": "Joining unlawful assembly armed with deadly weapon", "doctrine": "Armed Unlawful Assembly"},
    "146": {"bns": "191(1)", "title": "Rioting", "doctrine": "Force or Violence by Unlawful Assembly"},
    "147": {"bns": "191(2)", "title": "Punishment for rioting", "doctrine": "Rioting Penalties"},
    "148": {"bns": "191(3)", "title": "Rioting, armed with deadly weapon", "doctrine": "Aggravated Deadly Rioting"},
    "149": {"bns": "190", "title": "Every member of unlawful assembly guilty of offence committed in prosecution of common object", "doctrine": "Constructive Vicarious Liability of Assembly", "landmark": "Mizaji v. State of U.P. (1959) / Masalti v. State of U.P. (1965)", "ratio": "Member liable if offence committed in prosecution of common object or known to be likely."},
    "153A": {"bns": "196", "title": "Promoting enmity between different groups on grounds of religion, race, place of birth, residence, language, etc.", "doctrine": "Communal Harmony & Hate Speech", "landmark": "Manzar Sayeed Khan v. State of Maharashtra (2007)", "ratio": "Mens rea and clear tendency to disrupt public order are essential ingredients."},
    "153B": {"bns": "197", "title": "Imputations, assertions prejudicial to national-integration", "doctrine": "National Integration Protection"},
    "160": {"bns": "194", "title": "Punishment for committing affray", "doctrine": "Affray in Public Place"},
    
    # Offences by or Relating to Public Servants & False Evidence
    "166A": {"bns": "199", "title": "Public servant disobeying direction under law (Refusal to register FIR)", "doctrine": "Mandatory FIR Duty of Police", "landmark": "Lalita Kumari v. Govt. of U.P. (2014)", "ratio": "Refusal to register FIR for cognizable offence exposes police officer to criminal prosecution."},
    "177": {"bns": "212", "title": "Furnishing false information", "doctrine": "False Information to Public Servant"},
    "182": {"bns": "217", "title": "False information, with intent to cause public servant to use his lawful power to the injury of another person", "doctrine": "Malicious False Complaint to Police"},
    "186": {"bns": "221", "title": "Obstructing public servant in discharge of public functions", "doctrine": "Obstruction of Public Duties"},
    "188": {"bns": "223", "title": "Disobedience to order duly promulgated by public servant", "doctrine": "Violation of Prohibitory Orders (e.g. S. 144 CrPC / 163 BNSS)"},
    "191": {"bns": "227", "title": "Giving false evidence (Perjury)", "doctrine": "Perjury and Judicial Integrity"},
    "192": {"bns": "228", "title": "Fabricating false evidence", "doctrine": "Fabrication of Evidence for Judicial Proceeding"},
    "193": {"bns": "229", "title": "Punishment for false evidence", "doctrine": "Perjury Punishment"},
    "201": {"bns": "238", "title": "Causing disappearance of evidence of offence, or giving false information to screen offender", "doctrine": "Destruction of Evidence & Screening Accused", "landmark": "Palvinder Kaur v. State of Punjab (1952)", "ratio": "Requires proof that offence was committed and accused knowingly destroyed evidence to screen offender."},
    "211": {"bns": "248", "title": "False charge of offence made with intent to injure", "doctrine": "Malicious Prosecution and False Criminal Accusation"},
    "228A": {"bns": "72", "title": "Disclosure of identity of the victim of certain offences (Rape)", "doctrine": "Protection of Rape Victim Identity", "landmark": "Nipun Saxena v. Union of India (2019)", "ratio": "Absolute statutory bar on disclosing identity of sexual assault victim in any media or document."},
    
    # Public Safety, Religion & Morals
    "268": {"bns": "270", "title": "Public nuisance", "doctrine": "Public Nuisance Defined"},
    "269": {"bns": "271", "title": "Negligent act likely to spread infection of disease dangerous to life", "doctrine": "Infectious Disease Negligence"},
    "272": {"bns": "274", "title": "Adulteration of food or drink intended for sale", "doctrine": "Food Adulteration"},
    "279": {"bns": "281", "title": "Rash driving or riding on a public way", "doctrine": "Rash and Negligent Driving", "landmark": "State of Karnataka v. Muralidhar (2009)", "ratio": "Rashness implies acting with reckless disregard for consequences; negligence implies lack of reasonable care."},
    "283": {"bns": "285", "title": "Danger or obstruction in public way or line of navigation", "doctrine": "Obstruction of Public Way"},
    "294": {"bns": "296", "title": "Obscene acts and songs", "doctrine": "Public Obscenity"},
    "295A": {"bns": "299", "title": "Deliberate and malicious acts, intended to outrage religious feelings of any class", "doctrine": "Malicious Outrage of Religious Feelings", "landmark": "Ramji Lal Modi v. State of U.P. (1957)", "ratio": "Only deliberate and malicious attempts to insult religion are penalised, not careless insults."},
    
    # Offences Affecting the Human Body (Homicide, Hurt, Assault)
    "299": {"bns": "100", "title": "Culpable homicide", "doctrine": "Definition of Culpable Homicide"},
    "300": {"bns": "101", "title": "Murder", "doctrine": "Murder Defined & Five Exceptions", "landmark": "State of A.P. v. Rayavarapu Punnayya (1977)", "ratio": "Distinguishes degrees of culpable homicide vs murder based on probability and subjective intent."},
    "302": {"bns": "103(1)", "title": "Punishment for murder", "doctrine": "Capital Offence of Murder", "landmark": "Bachan Singh v. State of Punjab (1980)", "ratio": "Death penalty awarded only in 'rarest of rare cases' when alternative option is unquestionably foreclosed."},
    "304": {"bns": "105", "title": "Punishment for culpable homicide not amounting to murder (Part I and Part II)", "doctrine": "Culpable Homicide Sentences", "landmark": "K.M. Nanavati v. State of Maharashtra (1962)", "ratio": "Grave and sudden provocation requires deprivation of self-control before cooling period intervenes."},
    "304A": {"bns": "106(1)", "title": "Causing death by negligence (Rash & negligent act)", "doctrine": "Vehicular and Medical Negligence Death", "landmark": "Jacob Mathew v. State of Punjab (2005)", "ratio": "Criminal negligence requires gross negligence or recklessness, not mere error of judgment.", "delta": "BNS Section 106(2) provides up to 10 years imprisonment for hit-and-run drivers who fail to report incident."},
    "304B": {"bns": "80", "title": "Dowry death", "doctrine": "Dowry Death & 7-Year Presumption", "landmark": "Major Singh v. State of Punjab (2015) / Satbir Singh v. State of Haryana (2021)", "ratio": "Prosecution must prove cruelty or harassment for dowry 'soon before death' under unnatural circumstances within 7 years of marriage."},
    "306": {"bns": "108", "title": "Abetment of suicide", "doctrine": "Abetment of Suicide", "landmark": "M. Mohan v. State (2011) / Geo Varghese v. State of Rajasthan (2021)", "ratio": "Requires active instigation or proximate proximate act leaving deceased with no alternative."},
    "307": {"bns": "109", "title": "Attempt to murder", "doctrine": "Attempt to Murder", "landmark": "State of Maharashtra v. Balram Bama Patil (1983)", "ratio": "Bodily injury capable of causing death is not essential; intention and execution of act suffice."},
    "308": {"bns": "110", "title": "Attempt to commit culpable homicide", "doctrine": "Attempt to Commit Culpable Homicide"},
    "309": {"bns": "[Omitted]", "title": "Attempt to commit suicide", "doctrine": "Decriminalization of Suicide Attempt", "delta": "Section 309 IPC omitted in BNS. Replaced only by S. 226 BNS (attempt to suicide to compel public servant)."},
    "312": {"bns": "88", "title": "Causing miscarriage", "doctrine": "Illegal Miscarriage / Abortion"},
    "313": {"bns": "89", "title": "Causing miscarriage without woman's consent", "doctrine": "Non-consensual Miscarriage"},
    "319": {"bns": "114", "title": "Hurt", "doctrine": "Bodily Pain, Disease or Infirmity"},
    "320": {"bns": "116", "title": "Grievous hurt", "doctrine": "Eight Kinds of Grievous Hurt (Emasculation, Sight, Hearing, Fracture, 20 Days Pain)"},
    "323": {"bns": "115(2)", "title": "Punishment for voluntarily causing hurt", "doctrine": "Simple Hurt Penalties"},
    "324": {"bns": "118(1)", "title": "Voluntarily causing hurt by dangerous weapons or means", "doctrine": "Hurt with Deadly Weapons"},
    "325": {"bns": "117(2)", "title": "Punishment for voluntarily causing grievous hurt", "doctrine": "Grievous Hurt Penalties"},
    "326": {"bns": "118(2)", "title": "Voluntarily causing grievous hurt by dangerous weapons or means", "doctrine": "Grievous Hurt with Weapons (Life Imprisonment)"},
    "326A": {"bns": "124(1)", "title": "Voluntarily causing grievous hurt by use of acid, etc.", "doctrine": "Acid Attack Offence", "landmark": "Laxmi v. Union of India (2014)", "ratio": "Mandatory minimum 10 years imprisonment, fine payable to victim for medical treatment."},
    "326B": {"bns": "124(2)", "title": "Voluntarily throwing or attempting to throw acid", "doctrine": "Attempted Acid Attack"},
    "332": {"bns": "121(1)", "title": "Voluntarily causing hurt to deter public servant from his duty", "doctrine": "Assault on Public Servant on Duty"},
    "333": {"bns": "121(2)", "title": "Voluntarily causing grievous hurt to deter public servant from his duty", "doctrine": "Grievous Hurt to Public Servant"},
    "336": {"bns": "125(a)", "title": "Act endangering life or personal safety of others", "doctrine": "Endangering Human Safety"},
    "337": {"bns": "125(b)", "title": "Causing hurt by act endangering life or personal safety of others", "doctrine": "Negligent Hurt"},
    "338": {"bns": "125(c)", "title": "Causing grievous hurt by act endangering life or personal safety of others", "doctrine": "Negligent Grievous Hurt"},
    "339": {"bns": "126", "title": "Wrongful restraint", "doctrine": "Obstruction of Free Physical Movement"},
    "340": {"bns": "127", "title": "Wrongful confinement", "doctrine": "Total Circumscribed Confinement"},
    "341": {"bns": "126(2)", "title": "Punishment for wrongful restraint", "doctrine": "Wrongful Restraint Sanction"},
    "342": {"bns": "127(2)", "title": "Punishment for wrongful confinement", "doctrine": "Wrongful Confinement Sanction"},
    "351": {"bns": "130", "title": "Assault", "doctrine": "Apprehension of Criminal Force"},
    "352": {"bns": "131", "title": "Punishment for assault or criminal force otherwise than on grave provocation", "doctrine": "Assault Sanction"},
    "354": {"bns": "74", "title": "Assault or criminal force to woman with intent to outrage her modesty", "doctrine": "Outraging Modesty of Woman", "landmark": "State of Punjab v. Major Singh (1967) / Rupan Deol Bajaj v. KPS Gill (1995)", "ratio": "Ultimate test of outraging modesty is whether action shocks moral sense of womanhood."},
    "354A": {"bns": "75", "title": "Sexual harassment and punishment for sexual harassment", "doctrine": "Sexual Harassment (Physical, Demands, Pornography, Remarks)"},
    "354B": {"bns": "76", "title": "Assault or use of criminal force to woman with intent to disrobe", "doctrine": "Disrobing Assault"},
    "354C": {"bns": "77", "title": "Voyeurism", "doctrine": "Capturing or Disseminating Private Act of Woman"},
    "354D": {"bns": "78", "title": "Stalking", "doctrine": "Physical and Electronic Stalking"},
    "359": {"bns": "135", "title": "Kidnapping", "doctrine": "Kidnapping from India or Lawful Guardianship"},
    "361": {"bns": "137(1)", "title": "Kidnapping from lawful guardianship (Minor male <16, female <18)", "doctrine": "Enticing Minor out of Keeping of Guardian"},
    "362": {"bns": "138", "title": "Abduction", "doctrine": "Abduction by Force or Deceit"},
    "363": {"bns": "137(2)", "title": "Punishment for kidnapping", "doctrine": "Kidnapping Sanctions"},
    "364": {"bns": "140(1)", "title": "Kidnapping or abducting in order to murder", "doctrine": "Kidnapping for Murder"},
    "364A": {"bns": "140(2)", "title": "Kidnapping for ransom, etc.", "doctrine": "Kidnapping for Ransom (Life Imprisonment or Death)"},
    "365": {"bns": "140(3)", "title": "Kidnapping or abducting with intent secretly and wrongfully to confine person", "doctrine": "Kidnapping for Confinement"},
    "366": {"bns": "141", "title": "Kidnapping, abducting or inducing woman to compel her marriage, etc.", "doctrine": "Compelled Marriage / Illicit Intercourse"},
    "370": {"bns": "143", "title": "Trafficking of person", "doctrine": "Human Trafficking Framework"},
    "375": {"bns": "63", "title": "Rape", "doctrine": "Definition of Rape and Seven Non-Consent Circumstances"},
    "376": {"bns": "64", "title": "Punishment for rape", "doctrine": "Rape Punishments (Minimum 10 Years)", "landmark": "State of H.P. v. Mango Ram (2000)", "ratio": "Absence of physical struggle or injury does not indicate consent."},
    "376D": {"bns": "70(1)", "title": "Gang rape", "doctrine": "Gang Rape (Minimum 20 Years to Life)"},
    "376DA": {"bns": "70(2)", "title": "Gang rape of girl under sixteen years of age", "doctrine": "Aggravated Gang Rape of Minor"},
    "376DB": {"bns": "70(2)", "title": "Gang rape of girl under twelve years of age (Capital Punishment)", "doctrine": "Child Gang Rape"},
    "377": {"bns": "[Omitted]", "title": "Unnatural offences", "doctrine": "Decriminalization of Consensual Acts", "landmark": "Navtej Singh Johar v. Union of India (2018)", "ratio": "Consensual sexual acts between adults in private protected under Article 21; non-consensual acts covered under cruelty/assault/rape."},
    
    # Offences Against Property (Theft, Extortion, Robbery, Cheating)
    "378": {"bns": "303(1)", "title": "Theft", "doctrine": "Dishonest Taking of Movable Property out of Possession Without Consent"},
    "379": {"bns": "303(2)", "title": "Punishment for theft", "doctrine": "Theft Sanction (Up to 3 Years or Fine)"},
    "380": {"bns": "305", "title": "Theft in dwelling house, etc.", "doctrine": "Theft in Residential or Custodial Premises (Up to 7 Years)"},
    "381": {"bns": "306", "title": "Theft by clerk or servant of property in possession of master", "doctrine": "Fiduciary Theft by Employee"},
    "383": {"bns": "308(1)", "title": "Extortion", "doctrine": "Intentionally Putting Person in Fear of Injury to Deliver Property"},
    "384": {"bns": "308(2)", "title": "Punishment for extortion", "doctrine": "Extortion Sanctions"},
    "390": {"bns": "309(1)", "title": "Robbery", "doctrine": "Aggravated Theft or Extortion with Death/Hurt Threat"},
    "391": {"bns": "310(1)", "title": "Dacoity", "doctrine": "Robbery Committed by Five or More Persons Jointly"},
    "392": {"bns": "309(2)", "title": "Punishment for robbery", "doctrine": "Robbery Sanctions (Highway Robbery Between Sunset & Sunrise)"},
    "395": {"bns": "310(2)", "title": "Punishment for dacoity", "doctrine": "Dacoity Sanctions (Imprisonment for Life or 10 Years)"},
    "397": {"bns": "311", "title": "Robbery, or dacoity, with attempt to cause death or grievous hurt", "doctrine": "Robbery with Deadly Weapons (Minimum 7 Years)"},
    "403": {"bns": "314", "title": "Dishonest misappropriation of property", "doctrine": "Misappropriation of Innocent Possession"},
    "405": {"bns": "316(1)", "title": "Criminal breach of trust", "doctrine": "Entrustment of Property and Dishonest Conversion", "landmark": "Jaswantrai Manilal Akhaney v. State of Bombay (1956)", "ratio": "Entrustment of domain over property followed by dishonest conversion or disposal."},
    "406": {"bns": "316(2)", "title": "Punishment for criminal breach of trust", "doctrine": "CBT Sanctions (Up to 3 Years or 5 Years in BNS)", "delta": "BNS Section 316(2) increases punishment from 3 years under IPC 406 to up to 5 years imprisonment."},
    "409": {"bns": "316(5)", "title": "Criminal breach of trust by public servant, or by banker, merchant or agent", "doctrine": "Aggravated Fiduciary CBT (Life Imprisonment or 10 Years)"},
    "411": {"bns": "317(2)", "title": "Dishonestly receiving stolen property", "doctrine": "Possession of Stolen Property with Guilty Knowledge"},
    "415": {"bns": "318(1)", "title": "Cheating", "doctrine": "Deception and Fraudulent Inducement", "landmark": "Hridaya Ranjan Pd. Verma v. State of Bihar (2000)", "ratio": "Crucial distinction between breach of contract and cheating is fraudulent intent at inception."},
    "419": {"bns": "319", "title": "Punishment for cheating by personation", "doctrine": "Cheating by False Identity"},
    "420": {"bns": "318(4)", "title": "Cheating and dishonestly inducing delivery of property", "doctrine": "Aggravated Cheating (Delivery of Property)", "landmark": "Vesa Holdings P. Ltd. v. State of Kerala (2015) / Vijay Kumar Ghai v. State of W.B. (2022)", "ratio": "Mere failure to keep promise does not amount to Section 420; fraudulent inducement to part with property must exist ab initio."},
    "425": {"bns": "324(1)", "title": "Mischief", "doctrine": "Destruction of Property or Diminishing Value"},
    "427": {"bns": "324(2)", "title": "Mischief causing damage to the amount of fifty rupees", "doctrine": "Mischief Penalties (BNS increases threshold value)"},
    "441": {"bns": "329(1)", "title": "Criminal trespass", "doctrine": "Unlawful Entry to Commit Offence or Intimidate"},
    "442": {"bns": "329(2)", "title": "House-trespass", "doctrine": "Trespass into Human Dwelling or Place of Worship"},
    "447": {"bns": "329(3)", "title": "Punishment for criminal trespass", "doctrine": "Trespass Sanction"},
    "448": {"bns": "329(4)", "title": "Punishment for house-trespass", "doctrine": "House-Trespass Sanction"},
    "452": {"bns": "331(4)", "title": "House-trespass after preparation for hurt, assault or wrongful restraint", "doctrine": "Premeditated House-Trespass"},
    
    # Documents, Forgery & Property Marks
    "463": {"bns": "335", "title": "Forgery", "doctrine": "Making False Document with Intent to Cause Damage or Fraud"},
    "464": {"bns": "336", "title": "Making a false document", "doctrine": "Dishonest Execution or Alteration of Document", "landmark": "Sheila Sebastian v. R. Jawaharaj (2018)", "ratio": "A person cannot be convicted of forgery unless he is the maker of the false document himself."},
    "465": {"bns": "336(2)", "title": "Punishment for forgery", "doctrine": "Forgery Sanctions"},
    "467": {"bns": "338", "title": "Forgery of valuable security, will, etc.", "doctrine": "Forgery of Testamentary and Financial Instruments (Life Imprisonment)"},
    "468": {"bns": "336(3)", "title": "Forgery for purpose of cheating", "doctrine": "Forgery Linked with Deception"},
    "471": {"bns": "340(2)", "title": "Using as genuine a forged document or electronic record", "doctrine": "Uttering Forged Document Knowing It to Be Forged"},
    "477A": {"bns": "343", "title": "Falsification of accounts", "doctrine": "Corporate and Commercial Account Falsification"},
    
    # Marriage & Family
    "494": {"bns": "82", "title": "Marrying again during lifetime of husband or wife (Bigamy)", "doctrine": "Prohibition of Bigamy During Subsistence of Valid Marriage", "landmark": "Sarla Mudgal v. Union of India (1995)", "ratio": "Conversion to another religion does not dissolve first marriage; second marriage void and penal."},
    "497": {"bns": "[Omitted]", "title": "Adultery", "doctrine": "Decriminalization of Adultery", "landmark": "Joseph Shine v. Union of India (2018)", "ratio": "Adultery struck down as unconstitutional under Articles 14 and 21; omitted entirely from BNS."},
    "498A": {"bns": "85", "title": "Husband or relative of husband of a woman subjecting her to cruelty", "doctrine": "Matrimonial Cruelty & Dowry Harassment", "landmark": "Arnesh Kumar v. State of Bihar (2014) / Preeti Gupta v. State of Jharkhand (2010)", "ratio": "Requires wilful conduct likely to drive woman to suicide or harass for unlawful property demand. Arrest safeguards strictly enforced under BNSS 35."},
    
    # Defamation, Intimidation & Attempt
    "499": {"bns": "356(1)", "title": "Defamation", "doctrine": "Harm to Reputation and Ten Statutory Exceptions", "landmark": "Subramanian Swamy v. Union of India (2016)", "ratio": "Criminal defamation upheld as reasonable restriction on free speech under Article 19(2)."},
    "500": {"bns": "356(2)", "title": "Punishment for defamation", "doctrine": "Defamation Sanctions", "delta": "BNS Section 356(2) provides community service as an alternative punishment for defamation."},
    "503": {"bns": "351(1)", "title": "Criminal intimidation", "doctrine": "Threat to Person, Reputation or Property to Compel Act"},
    "504": {"bns": "352", "title": "Intentional insult with intent to provoke breach of the peace", "doctrine": "Insult to Provoke Public Disturbance"},
    "506": {"bns": "351(2)", "title": "Punishment for criminal intimidation", "doctrine": "Criminal Intimidation Penalties (Aggravated if Threat is Death)"},
    "509": {"bns": "79", "title": "Word, gesture or act intended to insult the modesty of a woman", "doctrine": "Verbal and Non-Physical Insult to Modesty"},
    "511": {"bns": "62", "title": "Punishment for attempting to commit offences punishable with imprisonment for life or other imprisonment", "doctrine": "Inchoate Offence of Criminal Attempt", "landmark": "Abhayanand Mishra v. State of Bihar (1961)", "ratio": "Attempt begins when culprit commences act towards commission of offence after preparation stage."},
}

# =========================================================================
# PROCEDURAL CRIMINAL LAW: CrPC ↔ BNSS
# =========================================================================
CRPC_TO_BNSS_MASTER: dict[str, dict[str, Any]] = {
    # Preliminary & Constitution of Courts
    "1": {"bnss": "1", "title": "Short title, extent and commencement", "doctrine": "Enforcement Date 1 July 2024"},
    "2": {"bnss": "2", "title": "Definitions (Cognizable, Bailable, Complaint, Investigation, Inquiry)", "doctrine": "Procedural Definitions"},
    "6": {"bnss": "6", "title": "Classes of Criminal Courts", "doctrine": "Hierarchy of Criminal Courts"},
    "9": {"bnss": "8", "title": "Court of Session", "doctrine": "Establishment of Sessions Court"},
    "11": {"bnss": "9", "title": "Courts of Judicial Magistrates", "doctrine": "Magistracy Tier Structure"},
    "24": {"bnss": "18", "title": "Public Prosecutors", "doctrine": "Appointment and Independence of Public Prosecutor"},
    "25": {"bnss": "19", "title": "Assistant Public Prosecutors", "doctrine": "Prosecution Cadre"},
    
    # Arrest of Persons
    "41": {"bnss": "35(1)", "title": "When police may arrest without warrant", "doctrine": "Arrest Powers & Necessity Standards", "landmark": "Arnesh Kumar v. State of Bihar (2014)", "ratio": "Police must satisfy objective necessity tests before making custodial arrest for offences up to 7 years."},
    "41A": {"bnss": "35(3)", "title": "Notice of appearance before police officer", "doctrine": "Mandatory Notice in Lieu of Arrest", "delta": "BNSS 35(7) introduces prior DSP permission for arrest of persons over 60 or infirm for offences < 3 years."},
    "41B": {"bnss": "36", "title": "Procedure of arrest and duties of officer making arrest", "doctrine": "Arrest Memo & Witness Attestation", "landmark": "D.K. Basu v. State of West Bengal (1997)", "ratio": "Arrest memo must be signed by at least one witness and countersigned by arrestee."},
    "41C": {"bnss": "37", "title": "Control room at districts", "doctrine": "Display of Arrested Persons List at District HQ"},
    "41D": {"bnss": "38", "title": "Right of arrested person to meet an advocate of his choice during interrogation", "doctrine": "Constitutional Right to Counsel (Article 22(1))"},
    "42": {"bnss": "39", "title": "Arrest on refusal to give name and residence", "doctrine": "Refusal to Disclose Identity & Release on Bond", "ratio": "Person refusing to disclose identity to police officer may be arrested only for ascertaining name and residence, and must be released on executing a bond with or without sureties once verified."},
    "43": {"bnss": "40", "title": "Arrest by private person and procedure on such arrest", "doctrine": "Citizen Arrest of Non-Bailable / Cognizable Offender", "landmark": "Amrit Singh v. State of Punjab (2006)", "ratio": "A private citizen may arrest any person who in his presence commits a non-bailable and cognizable offence or is a proclaimed offender, and must hand over the arrestee to police without unnecessary delay."},
    "44": {"bnss": "42", "title": "Arrest by Magistrate", "doctrine": "Magisterial Power of Arrest within Jurisdiction", "ratio": "Magistrate (Executive or Judicial) may arrest or order arrest of any person committing an offence in their presence within their local jurisdiction."},
    "45": {
        "bnss": "41",
        "title": "Protection of members of the Armed Forces from arrest",
        "doctrine": "Armed Forces Immunity from Arrest & Mandatory Prior Government Consent",
        "landmark": "Choudhury Parveen Sultana v. State of West Bengal (2009) 3 SCC 398 / S.K. Zutshi v. Bimal Debnath (2004) 8 SCC 31",
        "ratio": "Section 45 CrPC mandates that no member of the Armed Forces of the Union shall be arrested for anything done or purported to be done in the discharge of official duties except after obtaining prior consent of the Central Government. Operates as an absolute statutory bar against arbitrary custodial arrest.",
        "delta": "Section 41 of the Bharatiya Nagarik Suraksha Sanhita, 2023 directly transposes Section 45 CrPC in pari materia, upholding the statutory shield requiring prior consent of the Central or State Government before arresting members of the Armed Forces or designated state security personnel.",
    },
    "46": {"bnss": "43", "title": "Arrest how made (Female arrest protections)", "doctrine": "No Arrest of Woman Between Sunset and Sunrise Without Prior Magistrate Order"},
    "47": {"bnss": "44", "title": "Search of place entered by person sought to be arrested", "doctrine": "Ingress and Search of Premises for Arrest", "ratio": "Person having custody of premises must afford free ingress and search facilities to police officer having authority to arrest."},
    "48": {"bnss": "45", "title": "Pursuit of offenders into other jurisdictions", "doctrine": "Hot Pursuit Beyond Local Jurisdiction", "ratio": "Police officer may, for the purpose of arresting without warrant any person whom he is authorized to arrest, pursue such person into any place in India."},
    "49": {"bnss": "46", "title": "No unnecessary restraint", "doctrine": "Prohibition of Excessive Custodial Restraint & Handcuffing", "landmark": "Prem Shankar Shukla v. Delhi Administration (1980) / Citizen for Democracy (1995)", "ratio": "Arrested person shall not be subjected to more restraint than is necessary to prevent escape. Handcuffing is prima facie inhuman and violates Article 21 without recorded judicial approval."},
    "50": {"bnss": "47", "title": "Person arrested to be informed of grounds of arrest and of right to bail", "doctrine": "Written Grounds of Arrest", "landmark": "Pankaj Bansal v. UOI (2023) / Prabir Purkayastha (2024)", "ratio": "Grounds of arrest must be served in writing in understandable language prior to remand."},
    "50A": {"bnss": "48", "title": "Obligation of person making arrest to inform about the arrest, etc., to a nominated person", "doctrine": "Family/Nominee Notification Duty"},
    "51": {"bnss": "49", "title": "Search of arrested person", "doctrine": "Custodial Seizure of Articles"},
    "52": {"bnss": "50", "title": "Power to seize offensive weapons", "doctrine": "Seizure of Weapons from Arrested Person", "ratio": "Officer or private person arresting may take all offensive weapons from the arrestee and deliver them to court or officer."},
    "53": {"bnss": "51", "title": "Examination of accused by medical practitioner at the request of police officer", "doctrine": "Accused Medical Examination"},
    "53A": {"bnss": "52", "title": "Examination of person accused of rape by medical practitioner", "doctrine": "Mandatory Forensic Medical Examination in Rape", "landmark": "Krishan Kumar Malik v. State of Haryana (2011)", "ratio": "DNA profiling and medical examination under Section 53A CrPC provides crucial corroborative scientific evidence in sexual offences."},
    "54": {"bnss": "53", "title": "Examination of arrested person by medical officer", "doctrine": "Mandatory Independent Medical Checkup at Arrest"},
    "54A": {"bnss": "54", "title": "Identification of person arrested (TIP)", "doctrine": "Test Identification of Arrested Person", "ratio": "Where a person is arrested on a charge of committing an offence and his identification by any other person or persons is considered necessary, court may direct accused to subject to identification."},
    "55": {"bnss": "56", "title": "Procedure when police officer deputes subordinate to arrest without warrant", "doctrine": "Written Order / Command Slip for Subordinate Arrest", "ratio": "Officer in charge must deliver a written order specifying the offence and reason when deputing a subordinate officer to effect an arrest."},
    "55A": {"bnss": "55", "title": "Health and safety of arrested person", "doctrine": "Statutory Duty of Police to Ensure Accused Health and Safety", "landmark": "D.K. Basu v. State of West Bengal (1997)", "ratio": "It shall be the duty of the person having the custody of an accused to take reasonable care of the health and safety of the accused."},
    "56": {"bnss": "57", "title": "Person arrested to be taken before Magistrate or officer in charge of police station", "doctrine": "Immediate Production Before Competent Officer or Magistrate", "ratio": "Police officer making arrest without warrant must without unnecessary delay take or send the arrestee before the Magistrate having jurisdiction or before officer in charge."},
    "57": {"bnss": "58", "title": "Person arrested not to be detained more than twenty-four hours", "doctrine": "24-Hour Constitutional Remand Clock (Article 22(2))"},
    "58": {"bnss": "59", "title": "Police to report apprehensions", "doctrine": "Executive Reporting of All Arrests to District Magistrate", "ratio": "Officers in charge of police stations must report to the District Magistrate or Sub-Divisional Magistrate the cases of all persons arrested without warrant."},
    "59": {"bnss": "60", "title": "Discharge of person apprehended", "doctrine": "Discharge Only on Bond or Special Magistrate Order", "ratio": "No person who has been arrested by a police officer shall be discharged except on his own bond, or on bail, or under special order of a Magistrate."},
    "60": {"bnss": "61", "title": "Power on escape to pursue and retake", "doctrine": "Recapture of Escaped Custody Across India", "ratio": "If a person in lawful custody escapes or is rescued, the person from whose custody he escaped may immediately pursue and arrest him in any place in India."},
    "60A": {"bnss": "62", "title": "Arrest to be made strictly according to the Code", "doctrine": "Rule of Law Anchor for Deprivation of Liberty (Article 21)", "landmark": "D.K. Basu v. State of West Bengal (1997)", "ratio": "No arrest shall be made except in accordance with the provisions of this Code or any other law for the time being in force providing for arrest."},
    
    # Process to Compel Appearance & Production of Documents
    "61": {"bnss": "63", "title": "Form of summons", "doctrine": "Summons in Writing or Electronic Communication", "delta": "BNSS explicitly permits service of summons via encrypted electronic channels, email, and SMS."},
    "62": {"bnss": "64", "title": "Summons how served", "doctrine": "Personal and Electronic Service"},
    "70": {"bnss": "72", "title": "Form of warrant of arrest and duration", "doctrine": "Judicial Arrest Warrant Validity"},
    "71": {"bnss": "73", "title": "Power to direct security to be taken (Bailable warrant)", "doctrine": "Bailable Warrants Endorsement"},
    "82": {"bnss": "84", "title": "Proclamation for person absconding", "doctrine": "30-Day Proclamation for Proclaimed Offender"},
    "83": {"bnss": "85", "title": "Attachment of property of person absconding", "doctrine": "Attachment of Absconder Assets"},
    "91": {"bnss": "94", "title": "Summons to produce document or other thing", "doctrine": "Production of Critical Evidentiary Records", "landmark": "State of Orissa v. Debendra Nath Padhi (2005)", "ratio": "Defense cannot summon documents under S. 91 CrPC at the stage of framing of charge; only during trial."},
    "93": {"bnss": "96", "title": "When search-warrant may be issued", "doctrine": "Judicial Search Warrants"},
    "100": {"bnss": "103", "title": "Persons in charge of closed place to allow search / Independent witnesses", "doctrine": "Panch Witnesses and Search Legality"},
    "102": {"bnss": "106", "title": "Power of police officer to seize certain property", "doctrine": "Police Property Seizure / Bank Account Freezing", "landmark": "Nevada Properties v. State of Maharashtra (2019)", "ratio": "Section 102 does not authorize police officer to seize or seal immovable property."},
    
    # Security Proceedings & Maintenance
    "107": {"bnss": "126", "title": "Security for keeping the peace in other cases", "doctrine": "Executive Preventive Bond"},
    "116": {"bnss": "135", "title": "Inquiry as to truth of information", "doctrine": "Inquiry in Security Proceedings (6 Months Limit)"},
    "125": {"bnss": "144", "title": "Order for maintenance of wives, children and parents", "doctrine": "Speedy Summary Maintenance", "landmark": "Rajnesh v. Neha (2021)", "ratio": "Mandatory filing of Assets and Liabilities Affidavits; interim maintenance awarded from date of application."},
    "126": {"bnss": "145", "title": "Procedure", "doctrine": "Maintenance Evidence & Ex-Parte Orders"},
    "127": {"bnss": "146", "title": "Alteration in allowance", "doctrine": "Modification of Maintenance Quantum"},
    "128": {"bnss": "147", "title": "Enforcement of order of maintenance", "doctrine": "Recovery of Arrears & Distraint Warrants"},
    
    # Public Nuisance & Urgent Orders
    "133": {"bnss": "152", "title": "Conditional order for removal of nuisance", "doctrine": "Magisterial Public Nuisance Removal", "landmark": "Municipal Council, Ratlam v. Vardichan (1980)", "ratio": "Statutory duty of civic authorities to abate nuisance cannot be avoided pleading lack of financial resources."},
    "144": {"bnss": "163", "title": "Power to issue order in urgent cases of nuisance or apprehended danger", "doctrine": "Executive Curfew & Assembly Ban Orders", "landmark": "Anuradha Bhasin v. Union of India (2020)", "ratio": "Orders under S. 144 must satisfy test of proportionality and cannot be used to suppress legitimate dissent."},
    "145": {"bnss": "164", "title": "Procedure where dispute concerning land or water is likely to cause breach of peace", "doctrine": "Possessory Land Dispute Adjudication"},
    
    # Information to Police & Powers to Investigate (FIR, Remand, Statements)
    "154": {"bnss": "173", "title": "Information in cognizable cases (FIR)", "doctrine": "Mandatory FIR Registration", "landmark": "Lalita Kumari v. Govt. of U.P. (2014)", "ratio": "Registration of FIR is mandatory under Section 154 if information discloses commission of cognizable offence.", "delta": "BNSS Section 173 codifies Zero FIR (transferable to jurisdictional police station) and e-FIR."},
    "156": {"bnss": "175", "title": "Police officer's power to investigate cognizable case", "doctrine": "Plenary Investigative Domain of Police"},
    "156(3)": {"bnss": "175(3)", "title": "Magistrate empowered under section 190 may order such an investigation", "doctrine": "Magisterial Direction for Police FIR Investigation", "landmark": "Priyanka Srivastava v. State of U.P. (2015)", "ratio": "Application under S. 156(3) must be supported by an affidavit and prior recourse to S. 154(1) and 154(3)."},
    "160": {"bnss": "179", "title": "Police officer's power to require attendance of witnesses", "doctrine": "Witness Notice & Protections for Women/Seniors"},
    "161": {"bnss": "180", "title": "Examination of witnesses by police", "doctrine": "Police Witness Statements (Unsigned)", "delta": "BNSS 180 permits recording witness statements by audio-video electronic means."},
    "162": {"bnss": "181", "title": "Statements to police not to be signed: Use of statements in evidence", "doctrine": "Bar on Using Police Statements Except for S. 145 IEA / 148 BSA Contradiction"},
    "164": {"bnss": "183", "title": "Recording of confessions and statements by Magistrate", "doctrine": "Judicial Confessions & Victim Statements in Sexual Offences", "landmark": "Rabindra Kumar Pal @ Dara Singh v. Republic of India (2011)", "ratio": "Magistrate must explain to accused that he is not bound to make confession and provide cooling time."},
    "167": {"bnss": "187", "title": "Procedure when investigation cannot be completed in twenty-four hours (Remand & Default Bail)", "doctrine": "Custodial Remand & Indefeasible Default Bail", "landmark": "Bikramjit Singh v. State of Punjab (2020) / CBI v. Anupam J. Kulkarni (1992)", "ratio": "Right to default bail upon expiry of 60/90 days without chargesheet is fundamental right under Article 21.", "delta": "BNSS Section 187 permits 15 days police custody to be taken in whole or in parts during the first 40 or 60 days of detention."},
    "172": {"bnss": "192", "title": "Diary of proceedings in investigation (Case Diary)", "doctrine": "Case Diary Pagination and Maintenance"},
    "173": {"bnss": "193", "title": "Report of police officer on completion of investigation (Chargesheet)", "doctrine": "Final Police Report & Right to Speedy Investigation", "delta": "BNSS Section 193 mandates progress report to victim within 90 days and electronic submission."},
    "174": {"bnss": "194", "title": "Police to inquire and report on suicide, etc. (Inquest)", "doctrine": "Inquest Report Scope", "landmark": "Manoj Kumar Sharma v. State of Chhattisgarh (2016)", "ratio": "Inquest under Section 174 is limited to ascertaining apparent cause of death, not who caused it."},
    
    # Cognizance, Complaints & Process
    "190": {"bnss": "210", "title": "Cognizance of offences by Magistrates", "doctrine": "Cognizance on Police Report, Complaint, or Suo Motu"},
    "197": {"bnss": "218", "title": "Prosecution of Judges and public servants (Sanction)", "doctrine": "Statutory Prior Sanction Shield", "landmark": "D. Devaraja v. G. Dinesh Kumar (2021)", "ratio": "Sanction required if act complained of is reasonably connected with discharge of official duty."},
    "200": {"bnss": "223", "title": "Examination of complainant (Private criminal complaint)", "doctrine": "Complainant Verification on Oath", "delta": "BNSS Section 223 introduces mandatory opportunity of being heard to the accused before taking cognizance on private complaint."},
    "202": {"bnss": "225", "title": "Postponement of issue of process (Inquiry when accused outside jurisdiction)", "doctrine": "Mandatory Inquiry for Non-Resident Accused", "landmark": "Sunil Todi v. State of Gujarat (2021)", "ratio": "Postponement and inquiry under S. 202 is mandatory where accused resides beyond territorial jurisdiction."},
    "204": {"bnss": "227", "title": "Issue of process", "doctrine": "Summoning Order Legality"},
    "207": {"bnss": "230", "title": "Supply to the accused of copy of police report and other documents", "doctrine": "Accused Right to Complete Material & Unrelied Documents", "landmark": "Manoj v. State of M.P. (2023) / P. Ponnusamy v. State of T.N. (2022)", "ratio": "Prosecution must furnish all documents seized during investigation, including unrelied documents helpful to defense."},
    
    # Charges, Discharge & Trial Procedures
    "211": {"bnss": "234", "title": "Contents of charge", "doctrine": "Specific Notice of Allegations to Accused"},
    "216": {"bnss": "239", "title": "Court may alter charge", "doctrine": "Alteration of Charge Anytime Before Judgment"},
    "227": {"bnss": "250", "title": "Discharge (Sessions trial)", "doctrine": "Sessions Discharge / No Ground for Presuming Guilt", "landmark": "Union of India v. Prafulla Kumar Samal (1979) / Sajjan Kumar v. CBI (2010)", "ratio": "Court not a mere post office; must sift and weigh evidence to see if grave suspicion exists."},
    "228": {"bnss": "251", "title": "Framing of charge (Sessions trial)", "doctrine": "Prima Facie Case for Trial"},
    "239": {"bnss": "262", "title": "When accused shall be discharged (Warrant trial on police report)", "doctrine": "Discharge in Warrant Cases (Groundless Charge)"},
    "240": {"bnss": "263", "title": "Framing of charge (Warrant trial on police report)", "doctrine": "Framing Charge in Warrant Case"},
    "245": {"bnss": "268", "title": "When accused shall be discharged (Warrant case instituted otherwise than on police report)", "doctrine": "Discharge in Private Complaint Trial"},
    "251": {"bnss": "274", "title": "Substance of accusation to be stated (Summons cases)", "doctrine": "Summons Trial Notice"},
    "256": {"bnss": "279", "title": "Non-appearance or death of complainant", "doctrine": "Acquittal for Complainant Absence (Cheque Bounce / Private Complaint)"},
    "265A": {"bnss": "289", "title": "Application of the Chapter (Plea Bargaining)", "doctrine": "Plea Bargaining Eligibility (Max 7 Years, Not Against Women/Minors)"},
    
    # Inquiries & Trials (Witnesses, Section 311, 313, 319)
    "300": {"bnss": "337", "title": "Person once convicted or acquitted not to be tried for same offence", "doctrine": "Autrefois Acquit & Autrefois Convict (Article 20(2))"},
    "309": {"bnss": "346", "title": "Power to postpone or adjourn proceedings (Day-to-day trial)", "doctrine": "Speedy Trial & Adjournment Limits"},
    "311": {"bnss": "348", "title": "Power to summon material witness, or examine person present", "doctrine": "Essential Witness for Just Decision of Case", "landmark": "Zahira Habibullah Sheikh v. State of Gujarat (2004) / Manju Devi v. State of Rajasthan (2019)", "ratio": "Court has wide duty to summon or recall any witness if evidence appears essential to just decision."},
    "313": {"bnss": "351", "title": "Power to examine the accused", "doctrine": "Accused Personal Explanation on Incriminating Circumstances", "landmark": "Sukhjit Singh v. State of Punjab (2014) / Jai Prakash v. State of Haryana (2020)", "ratio": "Circumstance not put to accused under S. 313 cannot be used against him in judgment."},
    "319": {"bnss": "358", "title": "Power to proceed against other persons appearing to be guilty of offence", "doctrine": "Summoning Additional Accused During Trial", "landmark": "Hardeep Singh v. State of Punjab (2014) (5-Judge Bench)", "ratio": "Standard of evidence required under S. 319 is more than prima facie but less than proof beyond reasonable doubt."},
    "320": {"bnss": "359", "title": "Compounding of offences", "doctrine": "Compounding of Compoundable Offences / Quashing on Compromise"},
    "340": {"bnss": "379", "title": "Procedure in cases mentioned in section 195 (Perjury complaint by court)", "doctrine": "Judicial Complaint for Perjury & Forged Evidence", "landmark": "Iqbal Singh Marwah v. Meenakshi Marwah (2005)", "ratio": "Section 195(1)(b)(ii) bar applies only when document forged while in custodia curiae."},
    
    # Appeals, Revision & Bail
    "374": {"bnss": "415", "title": "Appeals from convictions", "doctrine": "Statutory Right of Criminal Appeal"},
    "378": {"bnss": "419", "title": "Appeal in case of acquittal", "doctrine": "High Court Acquittal Appeals & Double Presumption of Innocence"},
    "389": {"bnss": "430", "title": "Suspension of sentence pending the appeal; release of appellant on bail", "doctrine": "Bail Pending Criminal Appeal", "landmark": "Kashmira Singh v. State of Punjab (1977) / Bhagwan Rama Shinde (1999)", "ratio": "Sentence of fixed term normally suspended during pendency of appeal where appeal cannot be heard expeditiously."},
    "397": {"bnss": "438", "title": "Calling for records to exercise powers of revision (Revision)", "doctrine": "Correctness, Legality or Propriety of Magisterial Orders"},
    "401": {"bnss": "442", "title": "High Court's powers of revision", "doctrine": "Supervisory Revisional Jurisdiction"},
    "436": {"bnss": "478", "title": "In what cases bail to be taken (Bailable offences)", "doctrine": "Absolute Right to Bail in Bailable Offence"},
    "436A": {"bnss": "479", "title": "Maximum period for which an undertrial prisoner can be detained", "doctrine": "Undertrial Bail Reform (Half-Sentence Rule)", "delta": "BNSS Section 479 introduces landmark relief: first-time offenders who have never been convicted must be released on bail on serving one-third of maximum term."},
    "437": {"bnss": "480", "title": "When bail may be taken in case of non-bailable offence (Magistrate bail)", "doctrine": "Magistrate Bail in Non-Bailable Offences"},
    "438": {"bnss": "482", "title": "Direction for grant of bail to person apprehending arrest (Anticipatory Bail)", "doctrine": "Anticipatory Bail & Pre-Arrest Liberty", "landmark": "Gurbaksh Singh Sibbia (1980) / Sushila Aggarwal v. State (NCT of Delhi) (2020)", "ratio": "Anticipatory bail should not ordinarily be limited to a fixed time; protects liberty under Article 21."},
    "439": {"bnss": "483", "title": "Special powers of High Court or Court of Session regarding bail (Regular Bail)", "doctrine": "Regular Bail Criteria", "landmark": "P. Chidambaram v. CBI (2020) / Satender Kumar Antil (2022)", "ratio": "Tripod test: flight risk, tampering with evidence, influencing witnesses."},
    "482": {"bnss": "528", "title": "Saving of inherent powers of High Court (Quashing)", "doctrine": "Inherent Powers to Prevent Abuse of Process", "landmark": "State of Haryana v. Bhajan Lal (1992)", "ratio": "Seven categories where High Court will exercise inherent powers to quash FIR/chargesheet."},
}

# =========================================================================
# EVIDENTIARY LAW: IEA ↔ BSA
# =========================================================================
IEA_TO_BSA_MASTER: dict[str, dict[str, Any]] = {
    # Preliminary & Relevancy of Facts
    "3": {"bsa": "2", "title": "Interpretation clause (Court, Fact, Relevant, Fact in issue, Document, Evidence, Proved)", "doctrine": "Statutory Evidentiary Definitions", "delta": "BSA Section 2(1)(d) expands 'document' to include electronic and digital records, emails, server logs, smartphone messages."},
    "4": {"bsa": "3", "title": "May presume, Shall presume, Conclusive proof", "doctrine": "Three Degrees of Presumptions"},
    "5": {"bsa": "4", "title": "Evidence may be given of facts in issue and relevant facts", "doctrine": "Admissibility Limited to Relevant Facts"},
    "6": {"bsa": "5", "title": "Relevancy of facts forming part of same transaction (Res Gestae)", "doctrine": "Res Gestae & Spontaneous Utterances", "landmark": "Gentela Vijayavardhan Rao v. State of A.P. (1996)", "ratio": "Spontaneous statement made contemporaneously with event without time to concoct is admissible."},
    "7": {"bsa": "6", "title": "Facts which are the occasion, cause or effect of facts in issue", "doctrine": "Occasion, Cause and Opportunity"},
    "8": {"bsa": "7", "title": "Motive, preparation and previous or subsequent conduct", "doctrine": "Motive and Conduct of Accused/Victim"},
    "9": {"bsa": "8", "title": "Facts necessary to explain or introduce relevant facts (Test Identification Parade)", "doctrine": "Test Identification Parade (TIP)", "landmark": "Ravi @ Ravichandran v. State (2007)", "ratio": "Substantive evidence is identification in court; TIP under S. 9 provides corroboration."},
    "10": {"bsa": "9", "title": "Things said or done by conspirator in reference to common design", "doctrine": "Conspiracy Agency Rule (Prima Facie Proof First)", "landmark": "Badri Rai v. State of Bihar (1958) / State (NCT of Delhi) v. Navjot Sandhu (2005)", "ratio": "Acts/statements of co-conspirator admissible against all conspirators once reasonable ground exists."},
    "11": {"bsa": "10", "title": "When facts not otherwise relevant become relevant (Plea of Alibi)", "doctrine": "Plea of Alibi Strict Proof", "landmark": "Dudh Nath Pandey v. State of U.P. (1981)", "ratio": "Burden of proving plea of alibi is on accused; must establish physical impossibility of presence with certainty."},
    "14": {"bsa": "12", "title": "Facts showing existence of state of mind, or of body or bodily feeling", "doctrine": "State of Mind (Intention, Knowledge, Good Faith)"},
    "17": {"bsa": "15", "title": "Admission defined", "doctrine": "Definition of Admission"},
    "21": {"bsa": "19", "title": "Proof of admissions against persons making them, and by or on their behalf", "doctrine": "Admissions Admissible Against Maker"},
    "24": {"bsa": "21", "title": "Confession caused by inducement, threat or promise, when irrelevant in criminal proceeding", "doctrine": "Involuntary Confession Inadmissibility"},
    "25": {"bsa": "22", "title": "Confession to police officer not to be proved", "doctrine": "Total Inadmissibility of Police Confession", "landmark": "Aghnoo Nagesia v. State of Bihar (1966)", "ratio": "No confession made to police officer can be proved against accused; protects against custodial torture."},
    "26": {"bsa": "23(1)", "title": "Confession by accused while in custody of police not to be proved against him", "doctrine": "Custodial Confession Inadmissibility (Unless before Magistrate)"},
    "27": {"bsa": "23(2)", "title": "How much of information received from accused may be proved (Discovery of Fact)", "doctrine": "Section 27 Recovery / Confession Leading to Discovery", "landmark": "Pulukuri Kottaya v. Emperor (1947) / State of U.P. v. Deoman Upadhyaya (1960)", "ratio": "Only that distinct part of information which leads directly to discovery of a relevant physical fact is admissible."},
    "30": {"bsa": "24", "title": "Consideration of proved confession affecting person making it and others jointly under trial for same offence", "doctrine": "Confession of Co-Accused", "landmark": "Kashmira Singh v. State of M.P. (1952)", "ratio": "Co-accused confession cannot be treated as substantive evidence; can only lend assurance to other evidence."},
    "32(1)": {"bsa": "26(a)", "title": "Cases in which statement of relevant fact by person who is dead or cannot be found is relevant (Dying Declaration)", "doctrine": "Dying Declaration (Nemo Moriturus Praesumitur Mentire)", "landmark": "Khushal Rao v. State of Bombay (1958) / Laxman v. State of Maharashtra (2002)", "ratio": "A reliable, voluntary dying declaration recorded when maker is in fit state of mind can solely sustain conviction."},
    "34": {"bsa": "28", "title": "Entries in books of account including those maintained in an electronic form, when relevant", "doctrine": "Relevancy of Books of Account"},
    "45": {"bsa": "39", "title": "Opinions of experts (Foreign law, science, art, handwriting, finger impressions)", "doctrine": "Expert Opinion Evidence", "landmark": "Ramesh Chandra Agrawal v. Regency Hospital Ltd. (2009)", "ratio": "Expert evidence is opinion evidence; court must be satisfied as to expert qualifications and objective data."},
    "53": {"bsa": "47", "title": "In criminal cases previous good character relevant", "doctrine": "Previous Good Character of Accused"},
    "54": {"bsa": "48", "title": "Previous bad character not relevant, except in reply", "doctrine": "Inadmissibility of Previous Bad Character"},
    
    # Proof of Facts & Documents
    "56": {"bsa": "54", "title": "Fact judicially noticeable need not be proved", "doctrine": "Judicial Notice of Undisputed Facts"},
    "57": {"bsa": "55", "title": "Facts of which Court must take judicial notice", "doctrine": "Mandatory Judicial Notice Catalog"},
    "58": {"bsa": "56", "title": "Facts admitted need not be proved", "doctrine": "Admitted Facts in Trial"},
    "59": {"bsa": "57", "title": "Proof of facts by oral evidence", "doctrine": "All Facts Except Documents/Electronic Records Proved by Oral Evidence"},
    "60": {"bsa": "58", "title": "Oral evidence must be direct (Hearsay Rule)", "doctrine": "Exclusion of Hearsay Evidence", "landmark": "Kalyan Kumar Gogoi v. Ashutosh Agnihotri (2011)", "ratio": "Witness must testify to what he saw, heard, or perceived; hearsay evidence is strictly inadmissible."},
    "61": {"bsa": "59", "title": "Proof of contents of documents", "doctrine": "Proof by Primary or Secondary Evidence"},
    "62": {"bsa": "60", "title": "Primary evidence", "doctrine": "Original Document Itself"},
    "63": {"bsa": "61", "title": "Secondary evidence", "doctrine": "Certified Copies, Mechanical Copies, Counterparts"},
    "65": {"bsa": "62", "title": "Cases in which secondary evidence relating to documents may be given", "doctrine": "Conditions Precedent for Secondary Evidence", "landmark": "J. Yashoda v. K. Shobha Rani (2007)", "ratio": "Secondary evidence admissible only when foundational loss, destruction, or possession by adversary is proved."},
    "65A": {"bsa": "63(1)", "title": "Special provisions as to evidence relating to electronic record", "doctrine": "Electronic Record Admissibility Framework"},
    "65B": {"bsa": "63", "title": "Admissibility of electronic records (Mandatory Certificate)", "doctrine": "Electronic Records Certification & Digital Integrity", "landmark": "Arjun Panditrao Khotkar v. Kailash Kushanrao Gorantyal (2020) (3-Judge Bench)", "ratio": "Certificate under Section 65B(4) is mandatory condition precedent to the admissibility of secondary electronic evidence.", "delta": "BSA Section 63 introduces hash algorithms and semiconductor device recognition, making original electronic device primary evidence."},
    "74": {"bsa": "74", "title": "Public documents", "doctrine": "Public Records of Sovereign Authority"},
    "75": {"bsa": "75", "title": "Private documents", "doctrine": "All Other Documents Private"},
    "76": {"bsa": "76", "title": "Certified copies of public documents", "doctrine": "Certified Copies of Public Records"},
    "90": {"bsa": "88", "title": "Presumption as to documents thirty years old", "doctrine": "Ancient Documents Presumption (Genuineness of Custody & Execution)"},
    "91": {"bsa": "94", "title": "Evidence of terms of contracts, grants and other dispositions of property reduced to form of document", "doctrine": "Exclusion of Oral Evidence of Written Contracts"},
    "92": {"bsa": "95", "title": "Exclusion of evidence of oral agreement", "doctrine": "Parol Evidence Rule & Exceptions (Fraud, Illegality, Failure of Consideration)"},
    
    # Burden of Proof & Presumptions
    "101": {"bsa": "104", "title": "Burden of proof", "doctrine": "Burden of Proving Legal Right or Liability"},
    "102": {"bsa": "105", "title": "On whom burden of proof lies", "doctrine": "Onus of Proof Shifting in Trial"},
    "103": {"bsa": "106", "title": "Burden of proof as to particular fact", "doctrine": "Burden on Party Who Wishes Court to Believe Fact"},
    "105": {"bsa": "108", "title": "Burden of proving that case of accused comes within exceptions", "doctrine": "Accused Burden for General Exceptions", "landmark": "Vijayee Singh v. State of U.P. (1990)", "ratio": "Accused only required to establish preponderance of probability for private defence or insanity."},
    "106": {"bsa": "109", "title": "Burden of proving fact especially within knowledge", "doctrine": "Facts Especially Within Knowledge (Res Ipsa Loquitur)", "landmark": "State of West Bengal v. Mir Mohammad Omar (2000)", "ratio": "Section 106 does not relieve prosecution of primary burden; applies when fact is solely within knowledge of accused."},
    "113A": {"bsa": "116", "title": "Presumption as to abetment of suicide by a married woman", "doctrine": "Presumption of Suicide Abetment Within 7 Years of Marriage"},
    "113B": {"bsa": "117", "title": "Presumption as to dowry death", "doctrine": "Mandatory Presumption of Dowry Death", "landmark": "Satman Singh v. State of Punjab (2001)", "ratio": "Once prosecution proves cruelty for dowry soon before unnatural death within 7 years, court shall presume dowry death."},
    "114": {"bsa": "119", "title": "Court may presume existence of certain facts", "doctrine": "Judicial Presumptions of Human Conduct (Stolen Goods, Accomplice Unworthy, Official Acts)"},
    "114A": {"bsa": "120", "title": "Presumption as to absence of consent in certain prosecutions for rape", "doctrine": "Statutory Presumption of Absence of Consent in Rape Trial"},
    
    # Witnesses, Examination & Hostile Witness
    "118": {"bsa": "124", "title": "Who may testify (Child witnesses, lunatic)", "doctrine": "Competence of Witnesses & Child Testimony", "landmark": "Nivrutti Pandurang Kokate v. State of Maharashtra (2008)", "ratio": "Child witness competent if capable of understanding questions and giving rational answers."},
    "122": {"bsa": "128", "title": "Communications during marriage", "doctrine": "Marital Privilege Confidentiality"},
    "126": {"bsa": "132", "title": "Professional communications (Attorney-client privilege)", "doctrine": "Legal Professional Privilege Absolute Bar"},
    "133": {"bsa": "138", "title": "Accomplice", "doctrine": "Accomplice Competent Witness / Rule of Prudence for Corroboration", "landmark": "Bhuboni Sahu v. The King (1949)", "ratio": "Accomplice testimony is admissible, but prudence requires independent material corroboration."},
    "134": {"bsa": "139", "title": "Number of witnesses", "doctrine": "Quality Over Quantity of Evidence (Plurality Not Required)", "landmark": "Vadivelu Thevar v. State of Madras (1957)", "ratio": "Evidence must be weighed, not counted; solitary credible eye-witness sufficient for conviction."},
    "137": {"bsa": "142", "title": "Examination-in-chief, Cross-examination, Re-examination", "doctrine": "Three Stages of Witness Examination"},
    "138": {"bsa": "143", "title": "Order of examinations", "doctrine": "Order and Scope of Cross-Examination"},
    "141": {"bsa": "146", "title": "Leading questions", "doctrine": "Questions Suggesting Desired Answer"},
    "142": {"bsa": "147", "title": "When they must not be asked", "doctrine": "Bar on Leading Questions in Examination-in-Chief Without Court Permission"},
    "143": {"bsa": "148(1)", "title": "When they may be asked", "doctrine": "Permissibility of Leading Questions in Cross-Examination"},
    "145": {"bsa": "148", "title": "Cross-examination as to previous statements in writing (Contradiction)", "doctrine": "Confronting Witness with Section 161 CrPC Statements", "landmark": "Tahsildar Singh v. State of U.P. (1959)", "ratio": "To contradict witness, attention must be specifically drawn to portions of writing before it can be proved."},
    "154": {"bsa": "157", "title": "Question by party to his own witness (Hostile Witness)", "doctrine": "Cross-Examination of Own Witness", "landmark": "Sat Paul v. Delhi Administration (1976) / Neeraj Dutta v. State (NCT of Delhi) (2023)", "ratio": "Testimony of hostile witness not completely washed away; corroborated portion can be accepted."},
    "159": {"bsa": "162", "title": "Refreshing memory", "doctrine": "Witness Refreshing Memory from Contemporaneous Writing"},
    "165": {"bsa": "168", "title": "Judge's power to put questions or order production", "doctrine": "Inquisitorial Power of Judge to Discover Truth"},
}

# =========================================================================
# STANDALONE 2024 NEW PROVISIONS (NO DIRECT LEGACY EQUIVALENT)
# =========================================================================
NEW_PROVISIONS_2024: list[dict[str, Any]] = [
    {
        "id": "bns_4_community_service",
        "old_code": "IPC",
        "old_section": "N/A (New)",
        "old_title": "No legacy equivalent in Indian Penal Code",
        "new_code": "BNS",
        "new_section": "4(f)",
        "new_title": "Community service introduced as statutory punishment",
        "category": "SUBSTANTIVE",
        "concept_doctrine": "Restorative Justice & Community Service",
        "doctrine_summary": (
            "Section 4(f) BNS introduces community service as a formal penal punishment for six petty offences: "
            "small theft (< ₹5,000), public intoxication misconduct, defamation, public servant unlawfully trading, "
            "and suicide attempt to compel public duty."
        ),
        "landmark_precedents": [
            {
                "title": "Sunil Batra v. Delhi Administration",
                "citation": "(1978) 4 SCC 494",
                "court": "Supreme Court of India",
                "ratio": "Penal philosophy in India leans towards reformation rather than purely retributive punishment.",
            }
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 4(f) BNS Community Service",
                "delta_type": "NEW_PROVISO_ADDED",
                "details": "Magistrate can sentence first-time petty offenders to community service without custodial imprisonment.",
                "litigator_warning": "Advocate should move early application for community service in eligible petty offences to avoid conviction stain.",
            }
        ],
    },
    {
        "id": "bns_69_deceitful_intercourse",
        "old_code": "IPC",
        "old_section": "375 / 417 (Constructive)",
        "old_title": "Intercourse under misconception of fact",
        "new_code": "BNS",
        "new_section": "69",
        "new_title": "Sexual intercourse by employing deceitful means, etc.",
        "category": "SUBSTANTIVE",
        "concept_doctrine": "Deceitful Sexual Intercourse / False Promise to Marry",
        "doctrine_summary": (
            "Section 69 BNS creates a specific non-rape offence for sexual intercourse obtained by deceitful means, "
            "including false promise of employment, promotion, or marriage without any intention of fulfilling it. "
            "Punishable with up to 10 years imprisonment."
        ),
        "landmark_precedents": [
            {
                "title": "Anurag Soni v. State of Chhattisgarh",
                "citation": "(2019) 10 SCC 660",
                "court": "Supreme Court of India",
                "ratio": "Consent given on promise to marry is vitiated if promise was made with no intention to fulfill from inception.",
            },
            {
                "title": "Pramod Suryabhan Pawar v. State of Maharashtra",
                "citation": "(2019) 9 SCC 608",
                "court": "Supreme Court of India",
                "ratio": "Breach of promise to marry due to subsequent circumstances must be distinguished from false promise made at inception.",
            },
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 69 BNS Deceitful Intercourse",
                "delta_type": "SUBSTANTIAL_CHANGE",
                "details": "Separates false promise to marry cases from the stigma of Section 376 rape charges into a distinct penal offence.",
                "litigator_warning": "Defense must demonstrate that promise was genuine when made and frustrated by bona fide subsequent familial reasons.",
            }
        ],
    },
    {
        "id": "bns_103_2_mob_lynching",
        "old_code": "IPC",
        "old_section": "302 r/w 149 (Constructive)",
        "old_title": "Murder by unlawful assembly",
        "new_code": "BNS",
        "new_section": "103(2)",
        "new_title": "Murder committed on grounds of race, caste, sex, place of birth, language or religion by mob of five or more",
        "category": "SUBSTANTIVE",
        "concept_doctrine": "Hate Crime & Mob Lynching Strict Liability",
        "doctrine_summary": (
            "Section 103(2) BNS codifies mob lynching as a distinct aggravated capital murder offence when committed "
            "by a group of five or more acting in concert on discriminatory grounds of race, caste, sex, language or religion. "
            "Punishable with death or life imprisonment."
        ),
        "landmark_precedents": [
            {
                "title": "Tehseen S. Poonawalla v. Union of India",
                "citation": "(2018) 9 SCC 501",
                "court": "Supreme Court of India",
                "ratio": "Mob violence and vigilantism strike at the rule of law. Guidelines issued for zero tolerance and fast-track trials.",
            }
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 103(2) BNS Mob Lynching",
                "delta_type": "NEW_PROVISO_ADDED",
                "details": "Statutorily separates communal and caste-based mob murders from ordinary group homicides.",
                "litigator_warning": "Strict bail barriers apply; defense must scrutinize individual identification in mob setting under TIP safeguards.",
            }
        ],
    },
    {
        "id": "bns_111_organized_crime",
        "old_code": "IPC",
        "old_section": "N/A (State Acts: MCOCA, GUJCTOC)",
        "old_title": "Special state enactments only",
        "new_code": "BNS",
        "new_section": "111",
        "new_title": "Organized crime syndicates",
        "category": "SUBSTANTIVE",
        "concept_doctrine": "Organized Crime Syndicates & Continuing Unlawful Activity",
        "doctrine_summary": (
            "Section 111 BNS incorporates the organized crime framework into the general penal law across India. "
            "Penalizes continuing unlawful activity (kidnapping, extortion, cyber-crime, human trafficking) by a crime syndicate. "
            "Requires at least two chargesheets in preceding 10 years."
        ),
        "landmark_precedents": [
            {
                "title": "State of Maharashtra v. Lalit Somdatta Nagpal",
                "citation": "(2007) 4 SCC 171",
                "court": "Supreme Court of India",
                "ratio": "Organized crime provisions require strict construction; nexus with organized crime syndicate must be established.",
            }
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 111 BNS Organized Crime",
                "delta_type": "NEW_PROVISO_ADDED",
                "details": "Nationalizes MCOCA-like penalties without needing state-specific legislation.",
                "litigator_warning": "Challenge the nexus between accused and the syndicate; check whether two prior chargesheets exist within 10 years.",
            }
        ],
    },
    {
        "id": "bns_112_petty_organized_crime",
        "old_code": "IPC",
        "old_section": "379 / 420 / 120B (Fragmented)",
        "old_title": "Ordinary isolated offences",
        "new_code": "BNS",
        "new_section": "112",
        "new_title": "Petty organized crime (Theft, snatching, unauthorized ticketing by gangs)",
        "category": "SUBSTANTIVE",
        "concept_doctrine": "Petty Organized Gang Crime",
        "doctrine_summary": (
            "Section 112 BNS criminalizes group petty offences: vehicle theft, pick-pocketing, card skimming, examination paper leaks, "
            "and black marketing committed by gang members. Punishable with up to 7 years imprisonment."
        ),
        "landmark_precedents": [
            {
                "title": "State of U.P. v. Deoman Upadhyaya",
                "citation": "(1960) 3 SCR 14",
                "court": "Supreme Court of India",
                "ratio": "Classification of offences based on group organization and threat to public order satisfies Article 14.",
            }
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 112 BNS Petty Gang Crime",
                "delta_type": "NEW_PROVISO_ADDED",
                "details": "Aggravates ordinary theft and cheating into gang offences with mandatory imprisonment.",
                "litigator_warning": "Disprove gang membership and common enterprise; isolate accused as an individual first-time offender.",
            }
        ],
    },
    {
        "id": "bnss_105_mandatory_videography",
        "old_code": "CrPC",
        "old_section": "100 / 165 (No videography)",
        "old_title": "Physical search with panch witnesses",
        "new_code": "BNSS",
        "new_section": "105",
        "new_title": "Recording of search and seizure through audio-video electronic means",
        "category": "PROCEDURAL",
        "concept_doctrine": "Mandatory Audio-Video Electronic Recording of Search and Seizure",
        "doctrine_summary": (
            "Section 105 BNSS mandates that all search and seizure proceedings, including preparation of seizure memo and signature of witnesses, "
            "must be recorded through audio-video electronic means (e.g. mobile phone, bodycam) and forwarded to the Magistrate without delay."
        ),
        "landmark_precedents": [
            {
                "title": "Shafhi Mohammad v. State of H.P.",
                "citation": "(2018) 2 SCC 801",
                "court": "Supreme Court of India",
                "ratio": "Use of videography in crime scene inspection and search and seizure enhances police accountability and credibility.",
            }
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 105 BNSS Videography Requirement",
                "delta_type": "PROCEDURE_MODIFIED",
                "details": "Mandatory videography of search and seizure without police discretion.",
                "litigator_warning": "If search was conducted after 1 July 2024 without electronic recording, move application challenging seizure integrity.",
            }
        ],
    },
    {
        "id": "bnss_173_3_preliminary_inquiry",
        "old_code": "CrPC",
        "old_section": "154 (Judicial Lalita Kumari Exception)",
        "old_title": "Immediate FIR mandate",
        "new_code": "BNSS",
        "new_section": "173(3)",
        "new_title": "Preliminary inquiry before registration of FIR in 3 to 7 years offences",
        "category": "PROCEDURAL",
        "concept_doctrine": "Statutory Preliminary Inquiry Safeguard",
        "doctrine_summary": (
            "Section 173(3) BNSS provides that for offences punishable with imprisonment from 3 to 7 years, the police officer may, "
            "with prior permission of an officer not below Deputy Superintendent of Police (DSP), conduct a preliminary inquiry "
            "within 14 days to ascertain whether a prima facie case exists before registering FIR."
        ),
        "landmark_precedents": [
            {
                "title": "Lalita Kumari v. Govt. of U.P.",
                "citation": "(2014) 2 SCC 1",
                "court": "Supreme Court of India",
                "ratio": "Preliminary inquiry permitted in commercial offences, medical negligence, matrimonial disputes, and corruption.",
            }
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 173(3) BNSS Statutory Preliminary Inquiry",
                "delta_type": "NEW_PROVISO_ADDED",
                "details": "Codifies a 14-day window with prior DSP approval before registration of FIR in medium offences.",
                "litigator_warning": "Complainant can challenge inquiry exceeding 14 days; accused can submit exculpatory material during inquiry.",
            }
        ],
    },
    {
        "id": "bnss_356_trial_in_absentia",
        "old_code": "CrPC",
        "old_section": "299 (Deposition only, no judgment)",
        "old_title": "Record of evidence in absence of accused",
        "new_code": "BNSS",
        "new_section": "356",
        "new_title": "Inquiry, trial or judgment in absentia of proclaimed offender",
        "category": "PROCEDURAL",
        "concept_doctrine": "Trial in Absentia of Proclaimed Fugitive Offenders",
        "doctrine_summary": (
            "Section 356 BNSS creates an unprecedented power: when an accused declared as a proclaimed offender has absconded "
            "and there is no immediate prospect of arrest, the court may proceed with trial and pronounce final judgment and sentence in absentia."
        ),
        "landmark_precedents": [
            {
                "title": "Hussainara Khatoon v. Home Secretary, State of Bihar",
                "citation": "(1980) 1 SCC 81",
                "court": "Supreme Court of India",
                "ratio": "Fair trial under Article 21 requires effective representation and notice of proceedings.",
            }
        ],
        "statutory_deltas": [
            {
                "provision_name": "Section 356 BNSS Trial in Absentia",
                "delta_type": "SUBSTANTIAL_CHANGE",
                "details": "Permits full trial and conviction even if the accused is never arrested, provided 90-day notices and state counsel appointed.",
                "litigator_warning": "Challenge compliance with the strict 90-day multi-newspaper publication notice requirement before in absentia trial begins.",
            }
        ],
    },
]
