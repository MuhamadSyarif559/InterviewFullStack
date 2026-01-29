package com.example.backend.dto;

import com.fasterxml.jackson.annotation.JsonAlias;

public class RegisterRequest {
    public long id;
    public String email;
    public String password;
    public String name;
    public String companyName;
    @JsonAlias({ "employmentStatus" })
    public int EmploymentStatus;
    @JsonAlias({ "isDeleted" })
    public boolean IsDeleted;
    @JsonAlias({ "tenantId" })
    public long tenantID;
}
