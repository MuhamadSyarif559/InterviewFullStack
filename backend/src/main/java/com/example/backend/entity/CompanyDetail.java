package com.example.backend.entity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;


@Entity
@Table(name = "CompanyDetail") // avoid reserved word "user"
public class CompanyDetail {

    @Id  @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String companyName;

    @Column(nullable = false)
    private String address;

    @Column(nullable = false)
    private String PhoneNumbeString;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getcompanyName() {return companyName;}
    public void setcompanyName(String companyName) {this.companyName =companyName;} 

    public String getaddress() {return address;}
    public void setaddress(String address) {this.address =address;} 

    public String getPhoneNumbeString() {return PhoneNumbeString;}
    public void setPhoneNumbeString(String PhoneNumbeString) {this.PhoneNumbeString =PhoneNumbeString;} 


    
}
