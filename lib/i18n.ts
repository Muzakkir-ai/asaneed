export type Locale = 'ar' | 'ur' | 'en';
export function isLocale(value: unknown): value is Locale { return value === 'ar' || value === 'ur' || value === 'en'; }
export const languageOptions = [
 { value:'ar', label:'العربية', direction:'rtl' },
 { value:'ur', label:'اردو', direction:'rtl' },
 { value:'en', label:'English', direction:'ltr' },
] as const;
export const messages = {
 ar: {
  title:'التحقق من الإجازة | الأسانيد', description:'تحقق من الإجازة المعتمدة بإدخال رقمها في سجل الأسانيد والإجازات.',
  brand:'الأسانيد', subtitle:'توثيق الإجازات', register:'سجل الإجازات', heading:'التحقق من الإجازة',
  introduction:'أدخل رقم الإجازة للاطلاع على بياناتها والتحقق من اعتمادها.', language:'لغة الموقع',
  searchLabel:'البحث برقم الإجازة', number:'رقم الإجازة', hint:'الرقم المدوّن على الإجازة بعد عبارة «المسجّل برقم».',
  verify:'تحقق من الإجازة', checking:'جارٍ التحقق…', inputNote:'يمكنك إدخال الرقم بالأرقام العربية أو الإنجليزية.',
  invalid:'أدخل رقمًا من ثمانية أرقام، مع شرطة بعد أول أربعة أرقام.', unavailable:'تعذر الاتصال بخدمة التحقق. يرجى المحاولة مرة أخرى.',
  preparingTitle:'سجل التحقق قيد التجهيز', preparingBody:'ستتوفر نتائج التحقق بعد إدراج الإجازات المعتمدة في السجل.',
  notFoundTitle:'لم نعثر على إجازة بهذا الرقم', notFoundBody:'تحقق من الرقم المدوّن على الإجازة وحاول مجددًا. قد لا تكون الإجازة قد أُدرجت في السجل بعد.',
  verified:'إجازة معتمدة', issuer:'المجيز', qiraah:'القراءة', riwayah:'الرواية', completionDate:'تاريخ الإتمام', footer:'منصة الأسانيد والإجازات',
  login:'تسجيل الدخول', loginIntro:'للحسابات المفعّلة من إدارة المنصة.', email:'البريد الإلكتروني', password:'كلمة المرور', signIn:'دخول', signOut:'تسجيل الخروج',
  loginError:'تعذر تسجيل الدخول. تحقق من البريد وكلمة المرور ثم حاول مجددًا.', accountError:'تعذر تحميل الحساب', connectionError:'حدث خطأ في الاتصال. يرجى إعادة المحاولة.',
  pendingAccount:'الحساب بانتظار التفعيل', activationHelp:'يرجى التواصل مع إدارة المنصة لتفعيل صلاحيات الحساب.', welcome:'مرحبًا،',
  managementPreparing:'تم التحقق من حسابك. يجري تجهيز أدوات الإدارة ونقل البيانات.', loading:'جارٍ التحميل…', pageError:'تعذر تحميل الصفحة', retryHelp:'يرجى المحاولة مجددًا.', retry:'إعادة المحاولة',
 },
 ur: {
  title:'اجازہ کی تصدیق | الاسانید', description:'الاسانید کے رجسٹر میں اجازہ نمبر درج کرکے اس کی تصدیق کریں۔',
  brand:'الاسانید', subtitle:'اجازات کی توثیق', register:'اجازات کا رجسٹر', heading:'اجازہ کی تصدیق',
  introduction:'اجازہ کی تفصیلات اور اس کی منظوری کی تصدیق کے لیے اجازہ نمبر درج کریں۔', language:'ویب سائٹ کی زبان',
  searchLabel:'اجازہ نمبر سے تلاش کریں', number:'اجازہ نمبر', hint:'اجازہ پر «المسجّل برقم» کے بعد لکھا ہوا نمبر درج کریں۔',
  verify:'اجازہ کی تصدیق کریں', checking:'تصدیق جاری ہے…', inputNote:'آپ نمبر عربی یا انگریزی ہندسوں میں درج کر سکتے ہیں۔',
  invalid:'آٹھ ہندسوں کا نمبر درج کریں، پہلے چار ہندسوں کے بعد ایک ڈیش لگائیں۔', unavailable:'تصدیق کی خدمت سے رابطہ نہیں ہو سکا۔ دوبارہ کوشش کریں۔',
  preparingTitle:'تصدیقی رجسٹر تیار کیا جا رہا ہے', preparingBody:'منظور شدہ اجازات رجسٹر میں شامل ہونے کے بعد تصدیق کے نتائج دستیاب ہوں گے۔',
  notFoundTitle:'اس نمبر کا کوئی اجازہ نہیں ملا', notFoundBody:'اجازہ پر لکھا ہوا نمبر چیک کرکے دوبارہ کوشش کریں۔ ممکن ہے یہ اجازہ ابھی رجسٹر میں شامل نہ ہوا ہو۔',
  verified:'منظور شدہ اجازہ', issuer:'اجازہ دینے والے شیخ', qiraah:'قراءت', riwayah:'روایت', completionDate:'تکمیل کی تاریخ', footer:'اسانید و اجازات کا پلیٹ فارم',
  login:'لاگ اِن', loginIntro:'انتظامیہ کے فعال کردہ اکاؤنٹس کے لیے۔', email:'ای میل', password:'پاس ورڈ', signIn:'لاگ اِن کریں', signOut:'لاگ آؤٹ کریں',
  loginError:'لاگ اِن نہیں ہو سکا۔ ای میل اور پاس ورڈ چیک کرکے دوبارہ کوشش کریں۔', accountError:'اکاؤنٹ لوڈ نہیں ہو سکا', connectionError:'رابطے میں خرابی پیش آئی۔ دوبارہ کوشش کریں۔',
  pendingAccount:'اکاؤنٹ فعال ہونا باقی ہے', activationHelp:'اکاؤنٹ فعال کروانے کے لیے انتظامیہ سے رابطہ کریں۔', welcome:'خوش آمدید،',
  managementPreparing:'آپ کے اکاؤنٹ کی تصدیق ہو گئی ہے۔ انتظامی سہولیات اور ڈیٹا کی منتقلی پر کام جاری ہے۔', loading:'لوڈ ہو رہا ہے…', pageError:'صفحہ لوڈ نہیں ہو سکا', retryHelp:'دوبارہ کوشش کریں۔', retry:'دوبارہ کوشش کریں',
 },
 en: {
  title:'Verify an Ijazah | Asaneed', description:'Enter an ijazah number to verify it in the Asaneed register.',
  brand:'Asaneed', subtitle:'Ijazah verification', register:'Ijazah register', heading:'Verify an ijazah',
  introduction:'Enter the ijazah number to view its details and confirm its approval.', language:'Website language',
  searchLabel:'Search by ijazah number', number:'Ijazah number', hint:'Use the number printed after “المسجّل برقم” on the ijazah.',
  verify:'Verify ijazah', checking:'Checking…', inputNote:'You can enter Arabic or English digits.',
  invalid:'Enter eight digits, with a dash after the first four.', unavailable:'We couldn’t reach the verification service. Please try again.',
  preparingTitle:'The verification register is being prepared', preparingBody:'Verification results will be available once approved ijazahs have been added to the register.',
  notFoundTitle:'No ijazah found with this number', notFoundBody:'Check the number printed on the ijazah and try again. The ijazah may not have been added to the register yet.',
  verified:'Approved ijazah', issuer:'Issuing shaykh', qiraah:'Qira’ah', riwayah:'Riwayah', completionDate:'Completion date', footer:'Asaneed · Sanad and Ijazah Platform',
  login:'Sign in', loginIntro:'For accounts activated by the platform administrator.', email:'Email address', password:'Password', signIn:'Sign in', signOut:'Sign out',
  loginError:'Unable to sign in. Check your email and password, then try again.', accountError:'Unable to load your account', connectionError:'A connection error occurred. Please try again.',
  pendingAccount:'Your account is awaiting activation', activationHelp:'Contact the platform administrator to activate your account.', welcome:'Welcome,',
  managementPreparing:'Your account is verified. Management tools and data migration are being prepared.', loading:'Loading…', pageError:'Unable to load this page', retryHelp:'Please try again.', retry:'Try again',
 },
} satisfies Record<Locale, Record<string,string>>;
export function direction(locale: Locale) { return locale === 'en' ? 'ltr' : 'rtl'; }
export function dateLocale(locale: Locale) { return locale === 'ur' ? 'ur-PK' : locale === 'en' ? 'en-GB' : 'ar'; }
