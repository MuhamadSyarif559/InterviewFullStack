package com.example.backend.entity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;


@Entity
@Table(name = "users") // avoid reserved word "user"
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false, unique=true)
    private String email;

    @Column(nullable=false)
    private String password;
    
    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String companyName;

    @Column(nullable=true)
    private int EmploymentStatus;

    @Column(nullable= false)
    private boolean IsDeleted;

    @Column(nullable=true)
    private Long tenantID;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getName() {return name;}
    public void setName(String name) {this.name =name;} 

    public String getcompanyName() {return companyName;}
    public void setcompanyName(String companyName) {this.companyName =companyName;} 

    public int getEmployementStatus() {return EmploymentStatus;}
    public void setEmployementStatus(int  EmploymentStatus) {this.EmploymentStatus=EmploymentStatus;}

    public boolean getIsDeleted() {return IsDeleted;}
    public void setIsDeleted(boolean  IsDeleted) {this.IsDeleted=IsDeleted;}

    public Long gettenantID() {return tenantID;}
    public void settenantID(Long  tenantID) {this.tenantID=tenantID;}

}
