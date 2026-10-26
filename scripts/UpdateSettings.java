import java.io.*;
import java.nio.file.*;
import java.util.*;

public class UpdateSettings {
    public static void main(String[] args) throws Exception {
        if (args.length < 2) {
            System.err.println("Usage: java UpdateSettings.java <apk-path> <settings-json-path>");
            System.exit(1);
        }
        Path apkPath = Paths.get(args[0]);
        Path settingsJson = Paths.get(args[1]);
        byte[] content = Files.readAllBytes(settingsJson);

        Map<String, String> env = new HashMap<>();
        env.put("create", "false");

        // Open zip file system
        try (FileSystem fs = FileSystems.newFileSystem(apkPath, (ClassLoader) null)) {
            Path target = fs.getPath("assets/settings.json");
            Files.write(target, content, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING, StandardOpenOption.WRITE);
        }
        System.out.println("Updated assets/settings.json in " + apkPath);
    }
}
