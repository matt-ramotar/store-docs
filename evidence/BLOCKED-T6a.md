# T6a Dokka Build Blocked

Date: 2026-08-09

## Result

`./gradlew :store6-core:tasks --group documentation` exited `0` and confirmed:

```text
dokkaHtml - Generates documentation in 'html' format
```

`./gradlew :store6-core:dokkaHtml` reached Gradle and exited `1`. This was not a
timeout. `./gradlew :store6-mutations:dokkaHtml` was not run. No retry,
environment override, or workaround was attempted. The canonical Store6 Git
status was clean before and after the commands.

## Failure tail

```text
FAILURE: Build failed with an exception.


* What went wrong:
Could not determine the dependencies of task ':store6-core:dokkaHtml'.
> SDK location not found. Define a valid SDK location with an ANDROID_HOME environment variable or by setting the sdk.dir path in your project's local properties file at '/Users/matt/src/matt-ramotar/Store6/local.properties'.

* Try:
> Run with --stacktrace option to get the stack trace.
> Run with --info or --debug option to get more log output.
> Run with --scan to get full insights.
> Get more help at https://help.gradle.org.

BUILD FAILED in 500ms
4 actionable tasks: 4 up-to-date
```

## Required unblock

A valid Android SDK location is required through `ANDROID_HOME` or `sdk.dir` in
`/Users/matt/src/matt-ramotar/Store6/local.properties`. Until then, T6b must use
the prescribed placeholder route.
