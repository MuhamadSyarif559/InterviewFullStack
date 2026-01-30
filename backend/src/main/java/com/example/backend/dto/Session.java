package com.example.backend.dto;

public class Session {

    private final Long userId;
    private final String email;
    private final String name;
    private final String companyName;
    private final Long tenantID;
    private final Integer employmentStatus;
 

    public Session(Long userId, String email, String name, String companyName, Long tenantID, Integer employmentStatus) {
        this.userId = userId;
        this.email = email;
        this.name = name;
        this.companyName = companyName;
        this.tenantID = tenantID;
        this.employmentStatus = employmentStatus;
    }

    public Long getUserId() {
        return userId;
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

    public Long getTenantID() {
        return tenantID;
    }

    public Integer getEmploymentStatus() {
        return employmentStatus;
    }

}
