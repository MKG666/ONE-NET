# بناء APK عبر GitHub

1. ارفع محتويات هذا المشروع إلى مستودع GitHub.
2. افتح تبويب **Actions**.
3. اختر **Build Android APK**.
4. اضغط **Run workflow**، أو ادفع Commit إلى `main`/`master`.
5. بعد انتهاء البناء افتح الـworkflow ثم نزّل Artifact باسم **NetManager-APK**.

> هذا البناء مناسب لاختبار وتثبيت APK. للنشر على Google Play أو تحديثات إنتاجية سنضيف لاحقاً مفتاح توقيع Release محفوظاً في GitHub Secrets.
