using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FICCPlatform.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPermissionsSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Create OrganizationalStructure table
            migrationBuilder.CreateTable(
                name: "OrganizationalStructure",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    NameEn = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ParentId = table.Column<int>(type: "int", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrganizationalStructure", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OrganizationalStructure_OrganizationalStructure_ParentId",
                        column: x => x.ParentId,
                        principalTable: "OrganizationalStructure",
                        principalColumn: "Id");
                });

            // Create MenuItem table
            migrationBuilder.CreateTable(
                name: "MenuItem",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    NameEn = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Icon = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Route = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Order = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MenuItem", x => x.Id);
                });

            // Add OrganizationalStructureId to User table
            migrationBuilder.AddColumn<int>(
                name: "OrganizationalStructureId",
                table: "User",
                type: "int",
                nullable: true);

            // Create UserPermission table
            migrationBuilder.CreateTable(
                name: "UserPermission",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    MenuItemId = table.Column<int>(type: "int", nullable: false),
                    CanCreate = table.Column<bool>(type: "bit", nullable: false),
                    CanRead = table.Column<bool>(type: "bit", nullable: false),
                    CanUpdate = table.Column<bool>(type: "bit", nullable: false),
                    CanDelete = table.Column<bool>(type: "bit", nullable: false),
                    AssignedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserPermission", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserPermission_User_UserId",
                        column: x => x.UserId,
                        principalTable: "User",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserPermission_MenuItem_MenuItemId",
                        column: x => x.MenuItemId,
                        principalTable: "MenuItem",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            // Create PermissionAuditLog table
            migrationBuilder.CreateTable(
                name: "PermissionAuditLog",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    UserName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TargetUserId = table.Column<int>(type: "int", nullable: true),
                    TargetUserName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MenuItemId = table.Column<int>(type: "int", nullable: false),
                    MenuItemName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Action = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Changes = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ChangedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IpAddress = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PermissionAuditLog", x => x.Id);
                });

            // Create indexes for better performance
            migrationBuilder.CreateIndex(
                name: "IX_OrganizationalStructure_ParentId",
                table: "OrganizationalStructure",
                column: "ParentId");

            migrationBuilder.CreateIndex(
                name: "IX_User_OrganizationalStructureId",
                table: "User",
                column: "OrganizationalStructureId");

            migrationBuilder.CreateIndex(
                name: "IX_UserPermission_UserId",
                table: "UserPermission",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserPermission_MenuItemId",
                table: "UserPermission",
                column: "MenuItemId");

            migrationBuilder.CreateIndex(
                name: "IX_PermissionAuditLog_UserId",
                table: "PermissionAuditLog",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_PermissionAuditLog_TargetUserId",
                table: "PermissionAuditLog",
                column: "TargetUserId");

            migrationBuilder.CreateIndex(
                name: "IX_PermissionAuditLog_MenuItemId",
                table: "PermissionAuditLog",
                column: "MenuItemId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Drop tables in reverse order
            migrationBuilder.DropTable(name: "PermissionAuditLog");
            migrationBuilder.DropTable(name: "UserPermission");
            migrationBuilder.DropTable(name: "MenuItem");
            migrationBuilder.DropColumn(name: "OrganizationalStructureId", table: "User");
            migrationBuilder.DropTable(name: "OrganizationalStructure");
        }
    }
}
