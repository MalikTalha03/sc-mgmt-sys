import { useState } from "react";
import { FormInput } from "./formInput";
import { Button } from "./button";
import { Card, CardHeader } from "./card";
import { Dropdown } from "./dropdown";
import type { Department } from "../models/department";
import { UserPlus } from "lucide-react";

interface StudentFormProps {
    onSubmit?: (data: any) => void;
    departments?: Department[];
}

export function StudentForm({ onSubmit, departments = [] }: StudentFormProps) {
    const [formData, setFormData] = useState({
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
        <Card>
            <CardHeader>Add New Student</CardHeader>
            <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
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

                <Dropdown
                    label="Department"
                    options={departments.map(d => ({
                        value: d.code,
                        label: `${d.name} (${d.code})`
                    }))}
                    value={formData.departmentCode}
                    onChange={(value) => setFormData({ ...formData, departmentCode: value })}
                    placeholder="Select department"
                />

                <FormInput
                    label="Semester"
                    type="number"
                    min={1}
                    max={8}
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    required
                />

                <div style={{ marginTop: '8px' }}>
                    <Button type="submit" fullWidth>
                        <UserPlus size={18} />
                        Add Student
                    </Button>
                </div>
            </form>
        </Card>
    );
}