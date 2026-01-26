import React from "react";
import { FormInput } from "./formInput";
import { Button } from "./button";
import { Card, CardHeader } from "./card";
import { Dropdown } from "./dropdown";
import type { Department } from "../models/department";

interface StudentFormProps {
    onSubmit?: (data: any) => void;
    departments?: Department[];
}

export function StudentForm({ onSubmit, departments = [] }: StudentFormProps) {
    const [formData, setFormData] = React.useState({
        studentId: "",
        name: "",
        email: "",
        departmentCode: "",
        semester: "1",
        maxCreditHours: "18"
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit?.(formData);
        // Reset form
        setFormData({
            studentId: "",
            name: "",
            email: "",
            departmentCode: "",
            semester: "1",
            maxCreditHours: "18"
        });
    };

    return (
        <Card >
            <CardHeader className="p-2">Add New Student</CardHeader>
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4 p-6">
                    <FormInput
                        label="Student ID"
                        type="text"
                        placeholder="Enter student ID"
                        value={formData.studentId}
                        onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                        required
                    />

                    <FormInput
                        label="Full Name"
                        type="text"
                        placeholder="Enter student's full name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />

                    <FormInput
                        label="Email Address"
                        type="email"
                        placeholder="student@university.edu"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb- form-label">
                            Department Code*
                        </label>
                        <Dropdown
                            options={departments.map(d => ({
                                value: d.code,
                                label: `${d.name} (${d.code})`
                            }))}
                            value={formData.departmentCode}
                            onChange={(value) => setFormData({ ...formData, departmentCode: value })}
                            placeholder="Select department"
                        />
                    </div>

                    <FormInput
                        label="Semester"
                        type="number"
                        min={1}
                        max={8}
                        value={formData.semester}
                        onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                        required
                    />
                </div>

                <div className="pt-0 p-6 grid grid-cols-2">
                    <Button type="submit" className="w-full">
                        Add Student
                    </Button>
                </div>
            </form>

        </Card>
    );
}