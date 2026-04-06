# AttendanceApp

This application is designed to simplify and streamline employee attendance management through an efficient clock-in and clock-out system. Users can easily mark their attendance with a single tap, ensuring accurate time tracking for work hours.

The app automatically captures real-time location details at the time of check-in and check-out, providing transparency and accountability for both employees and management. This feature helps organizations verify attendance authenticity and monitor remote or on-site workforce activity effectively.

With a user-friendly interface and reliable tracking capabilities, the app reduces manual errors, enhances productivity, and ensures precise attendance records for payroll and reporting purposes.


<!-- Update This For the HTTP ERROR or Network Error -->
EmployeeAttendanceApp\android\app\src\main\AndroidManifest.xml
android:usesCleartextTraffic="true"

<!-- In this line -->
<application android:usesCleartextTraffic="true" android:name=".MainApplication" android:label="@string/app_name" android:icon="@mipmap/ic_launcher" android:roundIcon="@mipmap/ic_launcher_round" android:allowBackup="true" android:theme="@style/AppTheme">
