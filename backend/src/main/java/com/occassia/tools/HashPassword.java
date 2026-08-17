package com.occassia.tools;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class HashPassword {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String hash = encoder.encode(args.length > 0 ? args[0] : "admin123");
        System.out.println(hash);
        System.out.println("matches admin123: " + encoder.matches("admin123", hash));
    }
}
