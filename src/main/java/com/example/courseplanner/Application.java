/**
 * The entry point for the Course Planner application.
 * This class bootstraps the Spring Boot application and provides
 * a single shared resource: a hierarchical model of departments,
 * courses, offerings, and sections loaded from a CSV file.
 */

package com.example.courseplanner;

import com.example.courseplanner.model.*;
import com.example.courseplanner.service.DBLoader;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import java.util.Map;


@SpringBootApplication
public class Application {

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }

    /**
     * Loads the department data model from the CSV file and converts it to a map.
     * This bean provides a shared Map of all departments keyed by their IDs.
     */
    @Bean
    public Map<Long, Department> departmentMap(javax.sql.DataSource dataSource) {
        DBLoader dbLoader = new DBLoader(dataSource);
        // return the hierarchical model
        return dbLoader.loadAllData();
    }
}
