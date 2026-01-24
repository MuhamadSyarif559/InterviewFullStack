package com.example.backend.dto;

public class Session {

    private final String email;
    private final String name;
    private final String companyName;

    public Session(String email, String name, String companyName) {
        this.email = email;
        this.name = name;
        this.companyName = companyName;
    }

    public String getEmail() {
        return email;
    }

    public String getName() {
        return name;
    }

    public String getCompanyName() {
        return companyName;
    }

}
