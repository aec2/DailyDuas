export interface Prayer {
  id: number;
  arabic: string;
  transliteration: string;
  virtue: string;
  targetCount: number;
}

export const PRAYERS: Prayer[] = [
  {
    id: 1,
    arabic: "أَسْتَغْفِرُ اللَّهَ الَّذِي لَا إِلَهَ إِلَّا هُوَ الْحَيَّ الْقَيُّومَ وَأَتُوبُ إِلَيْهِ",
    transliteration: "Estağfirullâhellezî lâ ilâhe illâ hüvel hayyel kayyûme ve etûbü ileyh.",
    virtue: "Denizlerin köpüğü kadar günahı olsa da bu kelimeler kendisini okuyana keffaret olur.",
    targetCount: 3
  },
  {
    id: 2,
    arabic: "سُبْحَانَ اللَّهِ الْعَظِيمِ وَبِحَمْدِهِ وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
    transliteration: "Sübhânallâhil azîmi ve bihamdihî ve lâ havle ve lâ kuvvete illâ billâh.",
    virtue: "Bu kelimeleri söyleyen, ölene kadar şu dört hastalıktan muhafaza olur: Cüzzam, Delilik, Körlük, Felç.",
    targetCount: 3
  },
  {
    id: 3,
    arabic: "اللَّهُمَّ أَجِرْنِي مِنَ النَّارِ",
    transliteration: "Allâhümme ecirnî minen-nâr.",
    virtue: "Bu kelimeleri okuyan Cehennem'den korunur.",
    targetCount: 7
  },
  {
    id: 4,
    arabic: "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ يُحْيِي وَيُمِيتُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
    transliteration: "Lâ ilâhe illallâhü vahdehû lâ şerîke leh, lehül mülkü ve lehül hamdü yuhyî ve yümîtü ve hüve alâ külli şey'in kadîr.",
    virtue: "Bu kelimeleri okuyana 10 iyilik yazılır. 10 günahı silinir. 10 derecesi yükseltilir. 10 köle azad etme sevabı kazanır. Şeytandan ve kötülüklerden korunur.",
    targetCount: 10
  },
  {
    id: 5,
    arabic: "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ",
    transliteration: "Bismillâhillezî lâ yedurru measmihî şey'ün fil ardi ve lâ fis-semâi ve hüves-semîul alîm.",
    virtue: "Kim bu duayı okursa ona hiçbir şey zarar veremez.",
    targetCount: 3
  },
  {
    id: 6,
    arabic: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ",
    transliteration: "Eûzü bikelimâtillâhit-tâmmâti min şerri mâ halak.",
    virtue: "Bunu okuyan her eziyet verici şeyden korunur.",
    targetCount: 3
  },
  {
    id: 7,
    arabic: "رَضِيتُ بِاللَّهِ رَبًّا وَبِالْإِسْلَامِ دِينًا وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا",
    transliteration: "Radîtu billâhi rabben ve bil-islâmi dînen ve bi-muhammedin sallallâhu aleyhi ve selleme nebiyyen.",
    virtue: "Allahu Teâlâ bunu okuyanı kıyamet günü razı edip Cennet'ine koyar.",
    targetCount: 3
  },
  {
    id: 8,
    arabic: "حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ",
    transliteration: "Hasbiyallâhu lâ ilâhe illâ hû, aleyhi tevekkeltü ve hüve rabbül arşil azîm.",
    virtue: "Bunu okuyan kimsenin dünya ve ahiret sıkıntılarına Allah kâfi gelir.",
    targetCount: 7
  },
  {
    id: 9,
    arabic: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ",
    transliteration: "Allâhümme ente rabbî lâ ilâhe illâ ente halaktenî ve ene abdüke ve ene alâ ahdike ve va'dike mesteta'tü eûzü bike min şerri mâ sana'tü ebûü leke bi-ni'metike aleyye ve ebûü bi-zenbî fağfirlî feinnehû lâ yağfiruz-zünûbe illâ ente.",
    virtue: "Bu dua 'Seyyid'ül İstiğfar'dır. Okuyan Cennet'lik olur.",
    targetCount: 1
  },
  {
    id: 10,
    arabic: "اللَّهُمَّ (مَا أَصْبَحَ / مَا أَمْسَى) بِي مِنْ نِعْمَةٍ أَوْ بِأَحَدٍ مِنْ خَلْقِكَ فَمِنْكَ وَحْدَكَ لَا شَرِيكَ لَكَ فَلَكَ الْحَمْدُ وَلَكَ الشُّكْرُ",
    transliteration: "Allâhümme (sabah: mâ asbaha / akşam: mâ emsâ) bî min ni'metin ev bi-ehadin min halkıke fe-minke vahdeke lâ şerîke leke fe-lekel hamdü ve lekeş-şükür.",
    virtue: "Bu duayı okuyan gündüz ve gecenin nimetlerinin şükrünü eda etmiş olur.",
    targetCount: 1
  },
  {
    id: 11,
    arabic: "اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ... (آية الكرسي) + حم تَنْزِيلُ الْكِتَابِ مِنَ اللَّهِ الْعَزِيزِ الْعَلِيمِ * غَافِرِ الذَّنْبِ وَقَابِلِ التَّوْبِ شَدِيدِ الْعِقَابِ ذِي الطَّوْلِ لَا إِلَهَ إِلَّا هُوَ إِلَيْهِ الْمَصِيرُ",
    transliteration: "Âyet-el Kürsî + Hâ-mîm. Tenzîlül kitâbi minellâhil azîzil alîm. Ğâfiriz-zembi ve kâbilit-tevbi şedîdil ikâbi zit-tavl, lâ ilâhe illâ hû, ileyhil masîr.",
    virtue: "Bu ayetleri okuyan belâlardan ve cinlerden korunur.",
    targetCount: 1
  },
  {
    id: 12,
    arabic: "سُورَةُ الْإِخْلَاصِ - سُورَةُ الْفَلَقِ - سُورَةُ النَّاسِ",
    transliteration: "İhlas Suresi - Felak Suresi - Nas Suresi",
    virtue: "Kim İhlas, Felak ve Nâs sûrelerini okursa, bunlar onun her işi için kifâyet eder.",
    targetCount: 3
  },
  {
    id: 13,
    arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ وَأَعُوذُ بِكَ مِنَ الْعَجْزِ وَالْكَسَلِ وَأَعُوذُ بِكَ مِنَ الْجُبْنِ وَالْبُخْلِ وَأَعُوذُ بِكَ مِنْ غَلَبَةِ الدَّيْنِ وَقَهْرِ الرِّجَالِ",
    transliteration: "Allâhümme innî eûzü bike minel hemmi vel hazeni ve eûzü bike minel aczi vel keseli ve eûzü bike minel cübni vel buhli ve eûzü bike min galebetid-deyni ve kahrir-ricâl.",
    virtue: "Bu duayı okuyanın borçları ödenir ve sıkıntıları gider.",
    targetCount: 1
  },
  {
    id: 14,
    arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ لَا قُوَّةَ إِلَّا بِاللَّهِ مَا شَاءَ اللَّهُ كَانَ وَمَا لَمْ يَشَأْ لَمْ يَكُنْ أَعْلَمُ أَنَّ اللَّهَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ وَأَنَّ اللَّهَ قَدْ أَحَاطَ بِكُلِّ شَيْءٍ عِلْمًا",
    transliteration: "Sübhânallâhi ve bi-hamdihî lâ kuvvete illâ billâh mâşâallâhu kân ve mâ lem yeşe' lem yekün a'lemü ennallâhe alâ külli şey'in kadîr ve ennallâhe kad ehâta bikülli şey'in ilmâ.",
    virtue: "Bunu okuyan, bütün afetlerden ve korktuklarından emin olur.",
    targetCount: 1
  },
  {
    id: 15,
    arabic: "أَعُوذُ بِاللَّهِ السَّمِيعِ الْعَلِيمِ مِنَ الشَّيْطَانِ الرَّجِيمِ (3 defa) + هُوَ اللَّهُ الَّذِي لَا إِلَهَ إِلَّا هُوَ عَالِمُ الْغَيْبِ وَالشَّهَادَةِ هُوَ الرَّحْمَنُ الرَّحِيمُ * هُوَ اللَّهُ الَّذِي لَا إِلَهَ إِلَّا هُوَ الْمَلِكُ الْقُدُّوسُ السَّلَامُ الْمُؤْمِنُ الْمُهَيْمِنُ الْعَزِيزُ الْجَبَّارُ الْمُتَكَبِّرُ سُبْحَانَ اللَّهِ عَمَّا يُشْرِكُونَ * هُوَ اللَّهُ الْخَالِقُ الْبَارِئُ الْمُصَوِّرُ لَهُ الْأَسْمَاءُ الْحُسْنَى يُسَبِّحُ لَهُ مَا فِي السَّمَاوَاتِ وَالْأَرْضِ وَهُوَ الْعَزِيزُ الْحَكِيمُ",
    transliteration: "Eûzü billâhis-semîil alîmi mineş-şeytânir-racîm (3 defa) + Hüvallâhüllezî lâ ilâhe illâ hû... (Haşr Suresi son 3 ayeti)",
    virtue: "Bunu okuyana yetmiş bin melek dua eder. O kişi şehid olarak ölür.",
    targetCount: 1
  },
  {
    id: 16,
    arabic: "اللَّهُمَّ إِنِّي (أَصْبَحْتُ / أَمْسَيْتُ) أُشْهِدُكَ وَأُشْهِدُ حَمَلَةَ عَرْشِكَ وَمَلَائِكَتَكَ وَجَمِيعَ خَلْقِكَ أَنَّكَ أَنْتَ اللَّهُ لَا إِلَهَ إِلَّا أَنْتَ وَأَنَّ مُحَمَّدًا عَبْدُكَ وَرَسُولُكَ",
    transliteration: "Allâhümme innî (sabah: asbahtü / akşam: emseytü) üşhidüke ve üşhidü hamelete arşike ve melâiketeke ve cemîa halkıke enneke entellâhü lâ ilâhe illâ ente ve enne muhammeden abdüke ve resûlük.",
    virtue: "Bunu okuyanın bedeni Cehennem'den azâd olur ve bağışlanır.",
    targetCount: 4
  },
  {
    id: 17,
    arabic: "بِسْمِ اللَّهِ عَلَى نَفْسِي وَدِينِي بِسْمِ اللَّهِ عَلَى أَهْلِي وَمَالِي وَوَلَدِي بِسْمِ اللَّهِ عَلَى مَا أَعْطَانِي اللَّهُ. اللَّهُ رَبِّي لَا أُشْرِكُ بِهِ شَيْئًا. اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ. وَأَعَزُّ وَأَجَلُّ وَأَعْظَمُ مِمَّا أَخَافُ وَأَحْذَرُ عَزَّ جَارُكَ وَجَلَّ ثَنَاؤُكَ وَلَا إِلَهَ غَيْرُكَ. اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ شَرِّ نَفْسِي وَمِنْ شَرِّ كُلِّ شَيْطَانٍ مَرِيدٍ وَمِنْ شَرِّ كُلِّ جَبَّارٍ عَنِيدٍ * فَإِنْ تَوَلَّوْا فَقُلْ حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ * إِنَّ وَلِيِّيَ اللَّهُ الَّذِي نَزَّلَ الْكِتَابَ وَهُوَ يَتَوَلَّى الصَّالِحِينَ",
    transliteration: "Bismillâhi alâ nefsî ve dînî, bismillâhi alâ ehlî ve mâlî ve veledî, bismillâhi alâ mâ a'tânî rabbî, Allâhü Allâhü rabbî lâ üşrikü bihî şey'â, Allâhü ekber, Allâhü ekber, Allâhü ekber, ve eazzü ve ecellü ve a'zamü mimmâ ehâfü ve ahzeru azze câruk ve celle senâük ve lâ ilâhe gayruk...",
    virtue: "Bu duayı okuyanın canı, malı, dini ve ehli iyali her çeşit zarardan korunur.",
    targetCount: 1
  },
  {
    id: 18,
    arabic: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ عَلَيْكَ تَوَكَّلْتُ وَأَنْتَ رَبُّ الْعَرْشِ الْكَرِيمِ مَا شَاءَ اللَّهُ كَانَ وَمَا لَمْ يَشَأْ لَمْ يَكُنْ وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ الْعَلِيِّ الْعَظِيمِ أَعْلَمُ أَنَّ اللَّهَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ وَأَنَّ اللَّهَ قَدْ أَحَاطَ بِكُلِّ شَيْءٍ عِلْمًا. اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ شَرِّ نَفْسِي وَمِنْ شَرِّ كُلِّ دَابَّةٍ أَنْتَ آخِذٌ بِنَاصِيَتِهَا إِنَّ رَبِّي عَلَى صِرَاطٍ مُسْتَقِيمٍ",
    transliteration: "Allâhümme ente rabbî lâ ilâhe illâ ente aleyke tevekkeltü ve ente rabbül arşil azîm...",
    virtue: "Bu duayı okuyan her türlü tehlikelerden korunur.",
    targetCount: 1
  },
  {
    id: 19,
    arabic: "فَسُبْحَانَ اللَّهِ حِينَ تُمْسُونَ وَحِينَ تُصْبِحُونَ * وَلَهُ الْحَمْدُ فِي السَّمَاوَاتِ وَالْأَرْضِ وَعَشِيًّا وَحِينَ تُظْهِرُونَ * يُخْرِجُ الْحَيَّ مِنَ الْمَيِّتِ وَيُخْرِجُ الْمَيِّتَ مِنَ الْحَيِّ وَيُحْيِي الْأَرْضَ بَعْدَ مَوْتِهَا وَكَذَلِكَ تُخْرَجُونَ",
    transliteration: "Fe-sübhânallâhi hîne tümsûne ve hîne tusbihûn. Ve lehül hamdü fis-semâvâti vel ardi ve aşiyyen ve hîne tuzhirûn. Yuhricul hayye minel meyyiti ve yuhricul meyyite minel hayyi ve yuhyil arda ba'de mevtihâ ve kezâlike tuhracûn.",
    virtue: "Bu ayeti okuyan, o günkü eksik kalan zikir ve evradını telâfi etmiş olur.",
    targetCount: 1
  },
  {
    id: 20,
    arabic: "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ",
    transliteration: "Allâhümme salli alâ muhammedin ve alâ âli muhammed.",
    virtue: "Salavat okuyan kişiye Rasûlullah (s.a.v.) şefaatı vacib olur.",
    targetCount: 10
  }
];
