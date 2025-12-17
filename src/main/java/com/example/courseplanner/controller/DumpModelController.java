/**
 * Controller to dump the entire model to the server console.
 * Exposes the `/api/dump-model` endpoint.
 * Intended for debugging and verification purposes.
 */


package com.example.courseplanner.controller;

import com.example.courseplanner.model.Department;
import com.example.courseplanner.model.DumpModel;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class DumpModelController {
    private final Map<Long, Department> departmentMap;

    public DumpModelController(Map<Long, Department> departmentMap) {
        this.departmentMap = departmentMap;
    }

    @GetMapping("/dump-model")
    public void dumpModel() {
        DumpModel dumpModel = new DumpModel(departmentMap);
        System.out.println(dumpModel.generateDump());
    }
}
